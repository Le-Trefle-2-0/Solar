import {test} from "node:test";
import assert from "node:assert/strict";
import {tourSteps} from "./onboarding";

const titles = (permissions: string[], needsTwoFactor = false) => tourSteps(permissions, needsTwoFactor).map(s => s.title);

test("a volunteer sees the common steps only", () => {
    const common = titles(["tickets.send_message", "permanence.register"]);
    assert.equal(common.includes("Vos responsabilités"), false);
    assert.equal(common.includes("Activez la double authentification"), false);
    assert.equal(common[0], "Bienvenue sur Solar");
});

test("responsibilities list only the menus the account can open", () => {
    const step = tourSteps(["newsletters.manage"], false).find(s => s.title === "Vos responsabilités");
    assert.match(step!.text, /Newsletter/);
    assert.doesNotMatch(step!.text, /Rôles/);
    assert.match(tourSteps(["admin.sudo"], false).at(-1)!.text, /Bénévoles.*Rôles.*Newsletter/);
});

test("an account whose access is suspended is told to enable 2FA", () => {
    assert.equal(titles([], true).at(-1), "Activez la double authentification");
});
