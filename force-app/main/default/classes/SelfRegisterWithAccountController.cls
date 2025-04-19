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
  public static String submitRegistration(Contact contact) {
    throw new AuraHandledException('This method is not implemented yet.');
    // User existingUser = getUserByUsername(contact.Email);
    // if (existingUser != null) {
    //   throw new AuraHandledException(
    //     'A user with this email address already exists.'
    //   );
    // }

    // Contact upsertedContact = upsertContactByEmail(contact);
    // User newUser = createUserFromContact(upsertedContact);
    // return newUser.Id;
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

  public static Contact upsertContactByEmail(Contact contact) {
    List<Contact> contacts = [
      SELECT Id, AccountId
      FROM Contact
      WHERE Email = :contact.Email
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
    Contact existingContact;
    if (!contacts.isEmpty()) {
      existingContact = contacts[0];
    }
    if (existingContact == null) {
      if (!Schema.sObjectType.Contact.isCreateable()) {
        throw new System.NoAccessException();
      }
      insert contact;
    }
    return existingContact;
  }

  public static User createUserFromContact(Contact contact) {
    Database.DMLOptions dlo = new Database.DMLOptions();
    dlo.EmailHeader.triggerUserEmail = true;

    User newUser = new User(
      FirstName = contact.FirstName,
      LastName = contact.LastName,
      Email = contact.Email,
      Username = contact.Email,
      Alias = (contact.FirstName.substring(0, 1) +
        contact.LastName.substring(0, 1) +
        String.valueOf(Math.round(Math.random() * 10000)))
        .substring(0, 5),
      TimeZoneSidKey = 'America/New_York',
      LocaleSidKey = 'en_US',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US',
      ProfileId = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Standard User'
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

  public class ContactMatchResult {
    @AuraEnabled
    public String accountName;
    public ContactMatchResult(String name) {
      this.accountName = name;
    }
  }
}
