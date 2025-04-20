@isTest
private class SelfRegisterWithAccountControllerTest {
  @testSetup static void makeData() {
    Account testAccount = new Account(Name = 'Test Account');
    insert testAccount;
  }

  @IsTest
  static void submitNewContactRegistration() {
    Account testAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'Test Account'
      LIMIT 1
    ];

    Contact testContact = new Contact(
      LastName = 'Test',
      Email = 'test+' + String.valueOf(Math.random()).substring(2, 8) + '@example.com',
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
