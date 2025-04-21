@isTest
private class SelfRegisterWithAccountControllerTest {
  @testSetup
  static void makeData() {
    Account testAccount = new Account(Name = 'Test Account');
    insert testAccount;

    Contact testContact = new Contact(
      FirstName = 'Test',
      LastName = 'Contact',
      Email = 'test+' +
        String.valueOf(Math.random()).substring(2, 8) +
        '@example.com',
      AccountId = testAccount.Id
    );
    insert testContact;
  }

  @IsTest
  static void testGetAccountByContactEmail() {
    Contact testContact = [
      SELECT Id, Email
      FROM Contact
      WHERE Email LIKE 'test+%'
      LIMIT 1
    ];

    Test.startTest();
    Account account = SelfRegisterWithAccountController.getAccountByContactEmail(
      testContact.Email
    );
    Test.stopTest();

    Account testAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'Test Account'
      LIMIT 1
    ];

    System.assertNotEquals(null, account, 'Account should be found by email.');
    System.assertEquals(
      testAccount.Id,
      account.Id,
      'Returned account should match the inserted account.'
    );
  }

  @IsTest
  static void testGetAccountByContactEmailNewContact() {
    String testEmail =
      'newtest+' +
      String.valueOf(Math.random()).substring(2, 8) +
      '@example.com';

    Test.startTest();
    Account account = SelfRegisterWithAccountController.getAccountByContactEmail(
      testEmail
    );
    Test.stopTest();

    System.assertEquals(
      null,
      account,
      'No account should be found for new email.'
    );
  }

  @IsTest
  static void testSubmitRegistrationWithNewContact() {
    Account testAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'Test Account'
      LIMIT 1
    ];

    Contact testContact = new Contact(
      LastName = 'Test',
      Email = 'test+' +
        String.valueOf(Math.random()).substring(2, 8) +
        '@example.com',
      AccountId = testAccount.Id
    );

    Test.startTest();
    SelfRegisterWithAccountController.submitRegistration(testContact);
    Test.stopTest();

    User createdUser = [
      SELECT Id, FirstName, LastName, Email, AccountId
      FROM User
      WHERE Username = :testContact.Email
      LIMIT 1
    ];

    System.assertNotEquals(
      null,
      createdUser.Id,
      'User should be created successfully.'
    );
    System.assertEquals(
      testContact.LastName,
      createdUser.LastName,
      'User\'s last name should match the contact\'s last name.'
    );
    System.assertEquals(
      testContact.FirstName,
      createdUser.FirstName,
      'User\'s first name should match the contact\'s first name.'
    );
    System.assertEquals(
      testContact.Email,
      createdUser.Email,
      'User\'s email should match the contact\'s email.'
    );
    System.assertEquals(
      testContact.AccountId,
      createdUser.AccountId,
      'User\'s account should be the same as Contact\'s account.'
    );
  }
}
