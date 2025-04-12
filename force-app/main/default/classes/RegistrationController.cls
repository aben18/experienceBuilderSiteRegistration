public with sharing class RegistrationController {
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
    return new Account(
      Id = contacts[0].Account.Id,
      Name = contacts[0].Account.Name
    );
  }

  @AuraEnabled
  public static String submitRegistration(
    String firstName,
    String lastName,
    String email,
    String accountName
  ) {
    User existingUser = getUserByUsername(email);
    Account account = upsertAccountByName(accountName);
    Contact contact = upsertContactByEmail(firstName, lastName, email, account);
    User newUser = createUser(firstName, lastName, email, contact);
    return newUser.Id;
  }

  public static user getUserByUsername(String username) {
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

  public static Account upsertAccountByName(String accountName) {
    List<Account> accounts = [
      SELECT Id
      FROM Account
      WHERE Name = :accountName
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
    if (!accounts.isEmpty()) {
      return accounts[0];
    }
    Account newAccount = new Account(Name = accountName);
    if (!Schema.sObjectType.Account.isCreateable()) {
      throw new System.NoAccessException();
    }
    insert newAccount;
    return newAccount;
  }

  public static Contact upsertContactByEmail(
    String firstName,
    String lastName,
    String email,
    Account account
  ) {
    List<Contact> contacts = [
      SELECT Id, AccountId
      FROM Contact
      WHERE Email = :email
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
    Contact contact;
    if (!contacts.isEmpty()) {
      contact = contacts[0];
    }
    if (contact == null) {
      contact = new Contact(
        FirstName = firstName,
        LastName = lastName,
        Email = email,
        AccountId = account.Id
      );
      if (!Schema.sObjectType.Contact.isCreateable()) {
        throw new System.NoAccessException();
      }
      insert contact;
    }
    return contact;
  }

  public static User createUser(
    String firstName,
    String lastName,
    String email,
    Contact contact
  ) {
    Database.DMLOptions dlo = new Database.DMLOptions();
    dlo.EmailHeader.triggerUserEmail = true;

    User newUser = new User(
      FirstName = firstName,
      LastName = lastName,
      Email = email,
      Username = email,
      Alias = (firstName.substring(0, 1) +
        lastName.substring(0, 1) +
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
