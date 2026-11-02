jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const mockSetLocale = jest.fn();
let mockLocale: string = "en";
jest.mock("@/src/i18n/LocaleProvider", () => ({
  ...jest.requireActual("@/src/i18n/LocaleProvider"),
  useLocale: () => ({ locale: mockLocale, setLocale: mockSetLocale }),
}));

import {
  fireEvent,
  renderWithProviders,
  type TestInstance,
} from "@/src/test-utils/renderWithProviders";
import LanguageSettings from "@/app/(tabs)/settings/language";

const isPath = (node: TestInstance) => node.type === "RNSVGPath";

beforeEach(() => {
  mockSetLocale.mockClear();
  mockLocale = "en";
});

describe("Language settings screen", () => {
  it("shows the checkmark next to the currently selected locale only", async () => {
    mockLocale = "es";
    const { getByTestId } = await renderWithProviders(<LanguageSettings />);

    const spanishRow = getByTestId("language.option-es");
    expect(spanishRow.queryAll(isPath).map((path) => path.props.d)).toEqual(["M5 13L9 17L19 7"]);

    const englishRow = getByTestId("language.option-en");
    expect(englishRow.queryAll(isPath)).toHaveLength(0);
  });

  it("calls setLocale with the pressed language's code", async () => {
    const { getByTestId } = await renderWithProviders(<LanguageSettings />);

    await fireEvent.press(getByTestId("language.option-fr"));

    expect(mockSetLocale).toHaveBeenCalledWith("fr");
  });
});
