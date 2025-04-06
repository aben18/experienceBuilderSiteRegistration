public with sharing class RegistrationController {

    @AuraEnabled(cacheable=true)
    public static ContactMatchResult getAccountByContactEmail(String email) {
      List<Contact> contacts = [
        SELECT Id, Account.Name
        FROM Contact
        WHERE Email = :email
        WITH SECURITY_ENFORCED
        LIMIT 1
      ];
  
      if (!contacts.isEmpty() && contacts[0].Account != null) {
        return new ContactMatchResult(contacts[0].Account.Name);
      }
  
      return new ContactMatchResult(null);
    }
  
    @AuraEnabled
    public static String submitRegistration(String firstName, String lastName, String email, String accountName) {
      Contact contact;
      User user;
  
      List<Contact> contacts = [
        SELECT Id, AccountId
        FROM Contact
        WHERE FirstName = :firstName AND LastName = :lastName AND Email = :email
        WITH SECURITY_ENFORCED
        LIMIT 1];
      if (!contacts.isEmpty()) {
        contact = contacts[0];
      }
  
      if (contact == null) {
        Account account = [SELECT Id FROM Account WHERE Name = :accountName WITH SECURITY_ENFORCED LIMIT 1];
        if (account == null) {
          account = new Account(Name = accountName);
          if (!Schema.sObjectType.Account.isCreateable()) {
            throw new System.NoAccessException();
          }
          insert account;
        }
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
  
      List<User> existingUsers = [SELECT Id FROM User WHERE ContactId = :contact.Id WITH SECURITY_ENFORCED LIMIT 1];
  
      if (existingUsers.isEmpty()) {
        Database.DMLOptions dlo = new Database.DMLOptions();
        dlo.EmailHeader.triggerUserEmail = true;
  
        User newUser = new User(
          FirstName = firstName,
          LastName = lastName,
          Email = email,
          Username = email,
          Alias = (firstName.substring(0,1) + lastName.substring(0,1) + String.valueOf(Math.round(Math.random() * 10000))).substring(0, 5),
          TimeZoneSidKey = 'America/New_York',
          LocaleSidKey = 'en_US',
          EmailEncodingKey = 'UTF-8',
          LanguageLocaleKey = 'en_US',
          ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
          ContactId = contact.Id
        );
        newUser.setOptions(dlo);
        if (!Schema.sObjectType.User.isCreateable()) {
          throw new System.NoAccessException();
        }
        insert newUser;
        return newUser.Id;
      } else {
        return existingUsers[0].Id;
      }
    }
  
    public class ContactMatchResult {
      @AuraEnabled public String accountName;
      public ContactMatchResult(String name) {
        this.accountName = name;
      }
    }
  }