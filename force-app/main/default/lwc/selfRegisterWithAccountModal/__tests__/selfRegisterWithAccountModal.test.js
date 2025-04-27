import { createElement } from "@lwc/engine-dom";
import SelfRegisterWithAccountModal from "c/selfRegisterWithAccountModal";
import { createRecord } from "lightning/uiRecordApi";

describe("c-self-register-with-account-modal", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  const mapElementsByKey = (elements, key) =>
    Array.from(elements).reduce((map, element) => {
      map[element[key]] = element;
      return map;
    }, {});

  const flushPromises = () =>
    new Promise((resolve) => process.nextTick(resolve));

  it("renders all required form elements in initial state", () => {
    const element = createElement("c-self-register-with-account-modal", {
      is: SelfRegisterWithAccountModal
    });
    document.body.appendChild(element);
    const inputs = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-input"),
      "name"
    );
    const accountNameInput = inputs.accountName;
    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const cancelButton = buttons.cancel;
    const submitButton = buttons.submit;

    expect(accountNameInput).not.toBeNull();
    expect(cancelButton).not.toBeNull();
    expect(submitButton).not.toBeNull();
  });

  it("clicks cancel button without creating record", () => {
    const element = createElement("c-self-register-with-account-modal", {
      is: SelfRegisterWithAccountModal
    });
    document.body.appendChild(element);

    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const cancelButton = buttons.cancel;
    cancelButton.dispatchEvent(new CustomEvent("click"));

    expect(element.accountId).toBeUndefined();
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("sets value from lightning-input field as parameter to createRecord call", async () => {
    const USER_INPUT = "Test Account";
    const INPUT_PARAMETERS = [
      { apiName: "Account", fields: { Name: USER_INPUT } }
    ];

    const element = createElement("c-self-register-with-account-modal", {
      is: SelfRegisterWithAccountModal
    });
    document.body.appendChild(element);

    const inputs = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-input"),
      "name"
    );
    const accountNameInput = inputs.accountName;
    accountNameInput.reportValidity = jest.fn().mockReturnValue(true);
    accountNameInput.value = USER_INPUT;
    accountNameInput.dispatchEvent(new CustomEvent("change"));

    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const submitButton = buttons.submit;
    submitButton.dispatchEvent(new CustomEvent("click"));

    await flushPromises();
    expect(createRecord).toHaveBeenCalled();
    expect(createRecord.mock.calls[0]).toEqual(INPUT_PARAMETERS);
  });
});
