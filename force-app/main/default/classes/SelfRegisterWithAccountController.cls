public with sharing class SelfRegisterWithAccountController {
  @AuraEnabled(cacheable=true)
  public static Account getAccountByContactEmail(String email) {
    List<Contact> contacts = [
      SELECT Id, Account.Name
      FROM Contact
      WHERE Email = :email
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];

    if (contacts.isEmpty()) {
      return null;
    }
    return new Account(Id = contacts[0].Account.Id);
  }

  @AuraEnabled
  public static void submitRegistration(Contact contact) {
    if (String.isBlank(contact.LastName)) {
      throw new AuraHandledException('Last Name is required.');
    }
    if (String.isBlank(contact.Email)) {
      throw new AuraHandledException('Email is required.');
    }
    if (contact.AccountId == null) {
      throw new AuraHandledException('Account is required.');
    }
    User existingUser = getUserByUsername(contact.Email);
    if (existingUser != null) {
      throw new AuraHandledException(
        'A user with this email address already exists.'
      );
    }

    Contact upsertedContact = upsertContactByEmail(contact);
    createUserFromContact(upsertedContact);
  }

  public static User getUserByUsername(String username) {
    List<User> users = [
      SELECT Id, Username
      FROM User
      WHERE Username = :username
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
    if (users.isEmpty()) {
      return null;
    }
    return users[0];
  }

  public static Contact upsertContactByEmail(Contact newContact) {
    Contact existingContact = [
      SELECT Id, AccountId
      FROM Contact
      WHERE Email = :newContact.Email
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];

    Contact upsertContact = new Contact(
      Id = (existingContact != null) ? existingContact.Id : null,
      FirstName = newContact.FirstName,
      LastName = newContact.LastName,
      Email = newContact.Email,
      AccountId = (existingContact.AccountId != null)
        ? existingContact.AccountId
        : newContact.AccountId
    );

    if (
      existingContact != null &&
      existingContact.AccountId != newContact.AccountId
    ) {
      AccountContactRelation acr = new AccountContactRelation(
        AccountId = newContact.AccountId,
        ContactId = existingContact.Id
      );
      if (!Schema.sObjectType.AccountContactRelation.isCreateable()) {
        throw new System.NoAccessException();
      }
      insert acr;
    }

    if (!Schema.sObjectType.Contact.isCreateable()) {
      throw new System.NoAccessException();
    }
    if (!Schema.sObjectType.Contact.isUpdateable()) {
      throw new System.NoAccessException();
    }
    upsert upsertContact;
    return upsertContact;
  }

  public static User createUserFromContact(Contact contact) {
    Database.DMLOptions dlo = new Database.DMLOptions();
    dlo.EmailHeader.triggerUserEmail = true;

    User newUser = new User(
      FirstName = contact.FirstName,
      LastName = contact.LastName,
      Email = contact.Email,
      Username = contact.Email,
      Alias = createAlias(contact.FirstName, contact.LastName),
      TimeZoneSidKey = 'America/New_York',
      LocaleSidKey = 'en_US',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US',
      ProfileId = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Custom Customer Community User'
        LIMIT 1
      ]
      .Id,
      ContactId = contact.Id
    );
    newUser.setOptions(dlo);
    if (!Schema.sObjectType.User.isCreateable()) {
      throw new System.NoAccessException();
    }
    insert newUser;
    return newUser;
  }

  public static String createAlias(String firstName, String lastName) {
    String alias = '';
    if (!String.isBlank(firstName)) {
      alias += firstName.substring(0, Math.min(1, firstName.length()));
    }
    alias += lastName.substring(0, Math.min(4, lastName.length()));
    return alias;
  }

  public class ContactMatchResult {
    @AuraEnabled
    public String accountName;
    public ContactMatchResult(String name) {
      this.accountName = name;
    }
  }
}
