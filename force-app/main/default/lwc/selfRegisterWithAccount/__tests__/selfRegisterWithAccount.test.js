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

  const flushPromises = () =>
    new Promise((resolve) => process.nextTick(resolve));

  const mapElementsByKey = (elements, key) =>
    Array.from(elements).reduce((map, element) => {
      map[element[key]] = element;
      return map;
    }, {});

  it("renders all required form elements in initial state", () => {
    const element = createElement("c-self-register-with-account", {
      is: SelfRegisterWithAccount
    });
    document.body.appendChild(element);

    const inputs = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-input"),
      "name"
    );
    const firstNameInput = inputs.FirstName;
    const lastNameInput = inputs.LastName;
    const emailInput = inputs.Email;

    const recordPickers = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-record-picker"),
      "objectApiName"
    );
    const accountPicker = recordPickers.Account;

    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const createAccountButton = buttons.createNewAccount;
    const submitButton = buttons.submit;
    const loginButton = buttons.login;

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

    const inputs = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-input"),
      "name"
    );
    const lastNameInput = inputs.LastName;
    const emailInput = inputs.Email;
    lastNameInput.value = "Doe";
    emailInput.value = "john.doe@example.com";
    lastNameInput.dispatchEvent(new CustomEvent("change"));
    emailInput.dispatchEvent(new CustomEvent("change"));

    const recordPickers = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-record-picker"),
      "objectApiName"
    );
    const accountPicker = recordPickers.Account;
    accountPicker.dispatchEvent(new CustomEvent("focus"));

    await flushPromises();
    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const createAccountButton = buttons.createNewAccount;

    expect(createAccountButton.disabled).toBe(false);
  });

  it("enables the submit button when all required fields are filled", async () => {
    const element = createElement("c-self-register-with-account", {
      is: SelfRegisterWithAccount
    });
    document.body.appendChild(element);

    const inputs = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-input"),
      "name"
    );
    const lastNameInput = inputs.LastName;
    lastNameInput.value = "Doe";
    lastNameInput.dispatchEvent(new CustomEvent("change"));
    const emailInput = inputs.Email;
    emailInput.value = "john.doe@example.com";
    emailInput.dispatchEvent(new CustomEvent("change"));

    const recordPickers = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-record-picker"),
      "objectApiName"
    );
    const accountPicker = recordPickers.Account;
    accountPicker.dispatchEvent(
      new CustomEvent("change", {
        detail: { recordId: "001XXXXXXXX" }
      })
    );

    await flushPromises();
    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const submitButton = buttons.submit;

    expect(submitButton.disabled).toBe(false);
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

    await flushPromises();
    const errorParagraph = element.shadowRoot.querySelector(
      "div.slds-text-color_destructive p"
    );

    expect(errorParagraph).not.toBeNull();
    expect(errorParagraph.textContent).toBe(
      "A user with this email address already exists."
    );
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

    await flushPromises();
    expect(submitRegistration).toHaveBeenCalled();
    expect(window.location.href).not.toBe("");
  });
});
