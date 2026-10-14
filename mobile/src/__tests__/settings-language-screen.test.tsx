jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const mockSetLocale = jest.fn();
let mockLocale: string = "en";
jest.mock("@/src/i18n/LocaleProvider", () => ({
  ...jest.requireActual("@/src/i18n/LocaleProvider"),
  useLocale: () => ({ locale: mockLocale, setLocale: mockSetLocale }),
}));

import { Path } from "react-native-svg";
import { fireEvent, renderWithProviders, within } from "@/src/test-utils/renderWithProviders";
import LanguageSettings from "@/app/(tabs)/settings/language";

beforeEach(() => {
  mockSetLocale.mockClear();
  mockLocale = "en";
});

describe("Language settings screen", () => {
  it("shows the checkmark next to the currently selected locale only", () => {
    mockLocale = "es";
    const { getByTestId } = renderWithProviders(<LanguageSettings />);

    const spanishRow = getByTestId("language.option-es");
    expect(within(spanishRow).UNSAFE_getByType(Path).props.d).toBe("M5 13L9 17L19 7");

    const englishRow = getByTestId("language.option-en");
    expect(within(englishRow).UNSAFE_queryByType(Path)).toBeNull();
  });

  it("calls setLocale with the pressed language's code", () => {
    const { getByTestId } = renderWithProviders(<LanguageSettings />);

    fireEvent.press(getByTestId("language.option-fr"));

    expect(mockSetLocale).toHaveBeenCalledWith("fr");
  });
});
