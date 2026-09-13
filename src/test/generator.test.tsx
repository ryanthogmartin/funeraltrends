import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import VideoIdeas from "@/pages/VideoIdeas";
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), toast: vi.fn(), profile: false }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "test-user" }, loading: false }) }));
vi.mock("@/hooks/useVoiceProfile", () => ({ useVoiceProfile: () => ({ hasProfile: mocks.profile }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("@/components/ScriptModal", () => ({ default: (props: any) => props.open ? <div data-testid="script-context">{props.defaultTone}:{props.category}</div> : null }));
const titles = Array.from({ length: 8 }, (_, i) => `Idea ${i + 1}`);
beforeEach(() => { cleanup(); mocks.invoke.mockReset(); mocks.toast.mockReset(); mocks.profile = false; });
describe("free-text generator", () => {
  it("sends a trimmed free topic and fixed defaults, and preserves the context of displayed ideas", async () => {
    mocks.invoke.mockResolvedValue({ data: { success: true, ideas: titles } });
    render(<VideoIdeas />);
    expect(screen.queryByText("Keyword Database")).toBeNull();
    expect(screen.queryByText("Platform")).toBeNull();
    expect(screen.queryByText("Tone")).toBeNull();
    expect(screen.getByRole("button", { name: "Enter a topic above to continue" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("What would you like to talk about?"), { target: { value: "  a family question  " } });
    fireEvent.click(screen.getByRole("button", { name: /Generate 8 Video Ideas/ }));
    await screen.findByText("Idea 1");
    expect(mocks.invoke).toHaveBeenCalledWith("generate-video-topics", { body: expect.objectContaining({ topic: "a family question", inputMode: "free", tone: "compassionate-educator", platform: "facebook" }) });
    fireEvent.click(screen.getByRole("button", { name: "Legal" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Script" })[0]);
    expect(screen.getByTestId("script-context")).toHaveTextContent("compassionate-educator:demystify");
  });
  it("keeps saved voice an explicit choice", async () => {
    mocks.profile = true;
    mocks.invoke.mockResolvedValue({ data: { success: true, ideas: titles } });
    render(<VideoIdeas />);
    fireEvent.click(screen.getByLabelText("Use my saved voice profile"));
    fireEvent.change(screen.getByLabelText("What would you like to talk about?"), { target: { value: "a topic" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate 8 Video Ideas/ }));
    await screen.findByText("Idea 1");
    expect(mocks.invoke.mock.calls[0][1].body.tone).toBe("my-voice");
  });
  it.each([{ ideas: [] }, { ideas: [null] }, { ideas: "not an array" }])("reports unusable ideas instead of silent success: %j", async ({ ideas }) => {
    mocks.invoke.mockResolvedValue({ data: { success: true, ideas } });
    render(<VideoIdeas />);
    fireEvent.change(screen.getByLabelText("What would you like to talk about?"), { target: { value: "a topic" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate 8 Video Ideas/ }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Generation failed" })));
    expect(screen.queryByRole("button", { name: "Script" })).toBeNull();
  });
});
