public with sharing class SelfRegisterWithAccountController {
  
  @AuraEnabled(cacheable=true)
  public static Account getAccountByContactEmail(String email) {
    List<Contact> contacts = [
      SELECT Id, Account.Name, Account.Id
      FROM Contact
      WHERE Email = :email
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];

    if (contacts.isEmpty()) {
      return null;
    }
    return new Account(Id = contacts[0].Account.Id, Name = contacts[0].Account.Name);
  }

  @AuraEnabled
  public static void submitRegistration(Contact contact) {
    if (String.isBlank(contact.FirstName)) {
      throw new AuraHandledException('First Name is required.');
    }
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
        
        // Get all profiles assigned as members to this experience site
        List<Profile> siteProfiles = getExperienceSiteProfiles();
        Set<Id> siteProfileIds = new Set<Id>();
        for (Profile p : siteProfiles) {
            siteProfileIds.add(p.Id);
        }
        
        // Check if the user's profile is in the list of site profiles
        if (siteProfileIds.contains(existingUser.ProfileId) && accountId == existingUser.AccountId) {
            throw new AuraHandledException('A user with this email and organization already exists');
        }
         
      }
    

    Contact upsertedContact = null;
    try {
      upsertedContact = upsertContactByEmail(contact);
    } catch(Exception e) {
      throw new AuraHandledException(
        'Contact Upsert failed' + e
      );
    }

    try {
      createUserFromContact(upsertedContact);
    } catch(Exception e) {
      throw new AuraHandledException(
        'Create New User From Contact Failed' + e
      );
    }
    
  }

  @AuraEnabled(cacheable=true)
public static List<Profile> getExperienceSiteProfiles() {
    // First, get the current experience site's ID
    String networkId = Network.getNetworkId();
    
    if (String.isBlank(networkId)) {
        return new List<Profile>();
    }
    
    // Query for all profiles assigned to this experience site
    List<Profile> profiles = [
        SELECT Id, Name
        FROM Profile
        WHERE Id IN (
            SELECT ParentId 
            FROM NetworkMemberGroup 
            WHERE NetworkId = :networkId
        )
        WITH SECURITY_ENFORCED
        ORDER BY Name
    ];
    
    return profiles;
}


  @AuraEnabled(cacheable=true)
public static Account getAccountById(Id accountId) {
    if (accountId == null) {
      return null;
    }
    List<Account> accts = [
        SELECT Id, Name
        FROM Account
        WHERE Id = :accountId
        WITH SECURITY_ENFORCED
        LIMIT 1
    ];
    return accts.isEmpty() ? null : accts[0];
}


  public static User getUserByUsername(String username) {
    List<User> users = null;
    try{
      users = [
        SELECT Id, Username, Profile.Name
        FROM User
        WHERE Username = :username
        WITH SECURITY_ENFORCED
        LIMIT 1
      ];
      if (users.isEmpty()) {
        return null;
      } 
    } catch (Exception e) {
      throw new AuraHandledException('getUserByUsername Failed: ' + e);
    }
      return users[0];
  }

  public static Contact upsertContactByEmail(Contact newContact) {
    List<Contact> contacts = [
      SELECT Id, AccountId
      FROM Contact
      WHERE Email = :newContact.Email
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];

    Contact existingContact = (!contacts.isEmpty()) ? contacts[0] : null;

    Contact upsertContact = new Contact(
      Id = (existingContact != null) ? existingContact.Id : null,
      FirstName = newContact.FirstName,
      LastName = newContact.LastName,
      Email = newContact.Email,
      AccountId = (existingContact != null)
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
    User newUser = null;
    try {
      newUser = new User(
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
          WHERE Name = '#Ed-Fi: 365 User'
          LIMIT 1
        ]
        .Id,
        ContactId = contact.Id
      );
    } catch (Exception e) {
      throw new AuraHandledException('createUserFromContact SOQL failed: ' + e);
    }

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

      // 1) Account search
      @AuraEnabled(cacheable=true)
      public static List<Account> searchAccounts(String searchTerm, Integer limitSize) {
          // Clamp limit
          Integer lim = (limitSize == null || limitSize <= 0) ? 20 : Math.min(limitSize, 200);
      
          // Normalize input and remove SOQL wildcards so user input can't act as a wildcard
          String raw = (searchTerm == null) ? '' : searchTerm.trim();
          String safe = raw.replace('%','').replace('_','');
      
          //Require at least 2 characters
          if (safe.length() < 2) {
              return new List<Account>();
          }
      
          String sim = '%' + safe + '%';
      
          return [
              SELECT Id, Name
              FROM Account
              WHERE Name LIKE :sim
              ORDER BY Name
              LIMIT :lim
          ];
      }
}
