import { createElement } from "@lwc/engine-dom";
import SelfRegisterWithAccount from "c/selfRegisterWithAccount";
import submitRegistration from "@salesforce/apex/SelfRegisterWithAccountController.submitRegistration";

jest.mock(
  "@salesforce/apex/SelfRegisterWithAccountController.submitRegistration",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

const APEX_SUBMIT_EXISTING_USER_ERROR = {
  body: { message: "A user with this email address already exists." },
  ok: false,
  status: 500,
  statusText: "Server Error"
};

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
    const lastNameInput = Array.from(inputs).find(
      (input) => input.name === "LastName"
    );
    const emailInput = Array.from(inputs).find(
      (input) => input.name === "Email"
    );

    const recordPickers = element.shadowRoot.querySelectorAll(
      "lightning-record-picker"
    );
    const accountPicker = Array.from(recordPickers).find(
      (picker) => picker.objectApiName === "Account"
    );

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const createAccountButton = Array.from(buttons).find(
      (button) => button.name === "createNewAccount"
    );
    const submitButton = Array.from(buttons).find(
      (button) => button.name === "submit"
    );
    const loginButton = Array.from(buttons).find(
      (button) => button.name === "login"
    );

    expect(firstNameInput).not.toBeNull();
    expect(lastNameInput).not.toBeNull();
    expect(emailInput).not.toBeNull();
    expect(accountPicker).not.toBeNull();
    expect(createAccountButton).not.toBeNull();
    expect(createAccountButton.disabled).toBe(true);
    expect(submitButton).not.toBeNull();
    expect(submitButton.disabled).toBe(true);
    expect(loginButton).not.toBeNull();
  });

  it("enables the create account button when all required fields are filled", async () => {
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

  it("enables the submit button when all required fields are filled", async () => {
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
    accountPicker.dispatchEvent(
      new CustomEvent("change", {
        detail: { recordId: "001XXXXXXXX" }
      })
    );

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const submitButton = Array.from(buttons).find(
      (button) => button.name === "submit"
    );

    return Promise.resolve().then(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  it("ensures error displayed when user with email exists", async () => {
    submitRegistration.mockRejectedValue(APEX_SUBMIT_EXISTING_USER_ERROR);

    const element = createElement("c-self-register-with-account", {
      is: SelfRegisterWithAccount
    });
    document.body.appendChild(element);

    const inputs = element.shadowRoot.querySelectorAll("lightning-input");
    inputs.forEach((input) => {
      input.reportValidity = jest.fn().mockReturnValue(true);
    });

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const submitButton = Array.from(buttons).find(
      (button) => button.name === "submit"
    );
    submitButton.dispatchEvent(new CustomEvent("click"));

    await Promise.resolve();

    return Promise.resolve().then(() => {
      const errorParagraph = element.shadowRoot.querySelector(
        "div.slds-text-color_destructive p"
      );

      expect(errorParagraph).not.toBeNull();
      expect(errorParagraph.textContent).toBe(
        "A user with this email address already exists."
      );
    });
  });

  it("redirect after successful registration", async () => {
    submitRegistration.mockResolvedValue({});

    const element = createElement("c-self-register-with-account", {
      is: SelfRegisterWithAccount
    });
    document.body.appendChild(element);

    const inputs = element.shadowRoot.querySelectorAll("lightning-input");
    inputs.forEach((input) => {
      input.reportValidity = jest.fn().mockReturnValue(true);
    });

    delete window.location;
    window.location = { href: "" };

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const submitButton = Array.from(buttons).find(
      (button) => button.name === "submit"
    );
    submitButton.dispatchEvent(new CustomEvent("click"));

    return Promise.resolve().then(() => {
      expect(submitRegistration).toHaveBeenCalled();
      expect(window.location.href).not.toBe("");
    });
  });
});
