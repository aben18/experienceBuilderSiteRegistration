@isTest
private class SelfRegisterWithAccountControllerTest {
  @isTest
  static void submitRegistration() {
    Contact testContact = new Contact(
      FirstName = 'Test',
      LastName = 'User',
      Email = 'iambrianbell@gmail.com',
      AccountId = null
    );

    Test.startTest();
    SelfRegisterWithAccountController.submitRegistration(testContact);
    Test.stopTest();

    System.assertEquals(
      'Test',
      testContact.FirstName,
      'First name should be Test'
    );
  }
}
