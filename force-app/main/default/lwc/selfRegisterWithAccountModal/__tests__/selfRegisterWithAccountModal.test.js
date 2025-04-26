import { createElement } from "@lwc/engine-dom";
import SelfRegisterWithAccountModal from "c/selfRegisterWithAccountModal";

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

  it("returns value when submit button is clicked", () => {
    const element = createElement("c-self-register-with-account-modal", {
      is: SelfRegisterWithAccountModal
    });
    document.body.appendChild(element);

    const buttons = mapElementsByKey(
      element.shadowRoot.querySelectorAll("lightning-button"),
      "name"
    );
    const submitButton = buttons.submit;
    submitButton.dispatchEvent(new CustomEvent("click"));

    expect(element.closeValue).not.toBeNull();
  });
});
