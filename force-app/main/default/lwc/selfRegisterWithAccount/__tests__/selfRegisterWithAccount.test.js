import { createElement } from "@lwc/engine-dom";
import SelfRegisterWithAccount from "c/selfRegisterWithAccount";

describe("c-self-register-with-account", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders all required form elements in initial state", () => {
    const element = createElement("c-self-register-with-account", {
      is: SelfRegisterWithAccount
    });
    document.body.appendChild(element);

    const inputs = element.shadowRoot.querySelectorAll("lightning-input");
    const firstNameInput = Array.from(inputs).find(
      (input) => input.name === "FirstName"
    );
    expect(firstNameInput).not.toBeNull();
    const lastNameInput = Array.from(inputs).find(
      (input) => input.name === "LastName"
    );
    expect(lastNameInput).not.toBeNull();
    const emailInput = Array.from(inputs).find(
      (input) => input.name === "Email"
    );
    expect(emailInput).not.toBeNull();

    const recordPickers = element.shadowRoot.querySelectorAll(
      "lightning-record-picker"
    );
    const accountPicker = Array.from(recordPickers).find(
      (picker) => picker.objectApiName === "Account"
    );
    expect(accountPicker).not.toBeNull();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const createAccountButton = Array.from(buttons).find(
      (button) => button.name === "createNewAccount"
    );
    expect(createAccountButton).not.toBeNull();
    expect(createAccountButton.disabled).toBe(true);
    const submitButton = Array.from(buttons).find(
      (button) => button.name === "submit"
    );
    expect(submitButton).not.toBeNull();
    expect(submitButton.disabled).toBe(true);
    const loginButton = Array.from(buttons).find(
      (button) => button.name === "login"
    );
    expect(loginButton).not.toBeNull();
  });

  it("enables the create account button when all required fields are filled", () => {
    const element = createElement("c-self-register-with-account", {
      is: SelfRegisterWithAccount
    });
    document.body.appendChild(element);

    const inputs = element.shadowRoot.querySelectorAll("lightning-input");
    const lastNameInput = Array.from(inputs).find(
      (input) => input.name === "LastName"
    );
    lastNameInput.value = "Doe";
    lastNameInput.dispatchEvent(new CustomEvent("change"));
    const emailInput = Array.from(inputs).find(
      (input) => input.name === "Email"
    );
    emailInput.value = "john.doe@example.com";
    emailInput.dispatchEvent(new CustomEvent("change"));

    const recordPickers = element.shadowRoot.querySelectorAll(
      "lightning-record-picker"
    );
    const accountPicker = Array.from(recordPickers).find(
      (picker) => picker.objectApiName === "Account"
    );
    accountPicker.dispatchEvent(new CustomEvent("focus"));

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const createAccountButton = Array.from(buttons).find(
      (button) => button.name === "createNewAccount"
    );
    return Promise.resolve().then(() => {
      expect(createAccountButton.disabled).toBe(false);
    });
  });
});
