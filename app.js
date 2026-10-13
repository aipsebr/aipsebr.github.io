(() => {
  "use strict";

  const APP_VERSION = "1.1.0";
  const $ = (id) => document.getElementById(id);

  const ROLE_INSTRUCTION = `Lees de volledige prompt voordat je begint.

Bepaal welke deskundige rol het beste past bij de volledige opdracht. Neem vervolgens die rol aan en voer de opdracht vanuit die rol uit.

Baseer de rolkeuze op:
- de daadwerkelijke taak;
- de context;
- het gewenste resultaat;
- de doelgroep;
- de aard van de gevraagde uitvoer.

Kies de meest specifieke passende deskundige rol, maar gebruik geen specialistische rol wanneer de prompt daarvoor onvoldoende aanleiding geeft.`;

  const state = {
    currentPrompt: "",
    currentTitle: "",
    selectedSavedId: null
  };

  function normalize(value) {
    return String(value || "").trim();
  }

  function makeTitle(task) {
    const value = normalize(task).replace(/\s+/g, " ");
    if (!value) return "Opgeslagen prompt";
    return value.length <= 70 ? value : value.slice(0, 67) + "…";
  }

  function generatePrompt() {
    const task = normalize($("task").value);
    const context = normalize($("context").value);
    const outcome = normalize($("outcome").value);
    const manualRole = normalize($("manualRole").value);

    if (!task) return "";

    const sections = [];

    sections.push(`## Rolbepaling\n${ROLE_INSTRUCTION}`);

    if (manualRole) {
      sections.push(
        `## Handmatig opgegeven rol\n- Neem expliciet de volgende rol aan: ${manualRole}.\n- Deze handmatig opgegeven rol heeft voorrang op een automatisch afgeleide rol.`
      );
    }

    sections.push(`## Werkhouding\n- Werk deskundig, nauwkeurig, doelgericht en transparant over onzekerheden.`);

    sections.push(`## Opdracht\n${task}`);

    if (context) {
      const safeContext = context.replace(/^#/gm, "###");
      sections.push(
        `## Context\nGebruik onderstaande informatie als achtergrond voor de uitvoering van de opdracht. Maak duidelijk onderscheid tussen aangeleverde informatie en eigen afleidingen.\n\n"""\n${safeContext}\n"""`
      );
    }

    if (outcome) {
      sections.push(`## Gewenst resultaat\n${outcome}`);
    }

    sections.push(`## Instructies
- Voer de opdracht uit in het Nederlands, tenzij de opdracht expliciet om een andere taal vraagt.
- Beantwoord de opdracht direct.
- Prioriteer juistheid, relevantie en bruikbaarheid boven lengte.
- Maak geen onnodige aannames.
- Benoem relevante onzekerheden of ontbrekende informatie.
- Gebruik een professionele, heldere en natuurlijke schrijfstijl.
- Structureer het antwoord logisch en overzichtelijk.
- Gebruik opsommingen alleen wanneer die de leesbaarheid verbeteren.
- Controleer vóór het eindantwoord of aan de opdracht is voldaan.`);

    sections.push(`## Uitvoerformaat
- Gebruik duidelijke koppen en compacte alinea's.
- Kies zelf de meest geschikte structuur voor de gevraagde uitvoer.
- Gebruik een tabel, stappenplan, lijst of andere vorm wanneer die de bruikbaarheid aantoonbaar verbetert.`);

    sections.push(`## Kwaliteitscriteria
- Beantwoord de feitelijke opdracht direct.
- Laat relevante onzekerheden of ontbrekende informatie niet ongemerkt passeren.
- Vermijd generieke vulling, herhaling en onnodige disclaimers.
- Volg de gevraagde taal, structuur en randvoorwaarden.`);

    sections.push(`## Eindinstructie
- Voer de opdracht uit op basis van bovenstaande specificaties en geef een zelfstandig, bruikbaar eindresultaat.
- Begin je antwoord met de rol die je hebt aangenomen.
- Geef daarna eerst een korte samenvatting van deze opdracht.
- Geef vervolgens het gevraagde resultaat.`);

    return sections.join("\n\n");
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1700);
  }

  function saveItems() {
    try {
      return JSON.parse(localStorage.getItem("ai-prompt-studio-saved") || "[]");
    } catch {
      return [];
    }
  }

  function writeItems(items) {
    localStorage.setItem("ai-prompt-studio-saved", JSON.stringify(items));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Prompt gekopieerd");
      return true;
    } catch {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      const ok = document.execCommand("copy");
      helper.remove();
      showToast(ok ? "Prompt gekopieerd" : "Kopiëren is niet gelukt");
      return ok;
    }
  }

  async function shareText(text, title = "AI Prompt Studio") {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    await copyText(text);
    showToast("Prompt gekopieerd; je kunt hem nu delen");
  }

  function renderSavedList() {
    const items = saveItems();
    const list = $("savedList");
    const empty = $("savedEmpty");
    list.replaceChildren();
    empty.style.display = items.length ? "none" : "block";

    items.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "saved-item";

      const title = document.createElement("span");
      title.className = "saved-item-title";
      title.textContent = item.title;

      const date = document.createElement("span");
      date.className = "saved-item-date";
      date.textContent = new Date(item.createdAt).toLocaleString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });

      button.append(title, date);
      button.addEventListener("click", () => openSavedDetail(item.id));
      list.appendChild(button);
    });
  }

  function openSavedDetail(id) {
    const item = saveItems().find(x => x.id === id);
    if (!item) return;

    state.selectedSavedId = id;
    $("savedDetailTitle").textContent = item.title;
    $("savedDetailOutput").textContent = item.prompt;
    showScreen("savedDetailScreen");
  }

  function saveCurrentPrompt() {
    if (!state.currentPrompt) return;

    const items = saveItems();
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: state.currentTitle || "Opgeslagen prompt",
      prompt: state.currentPrompt,
      createdAt: new Date().toISOString()
    };

    items.unshift(item);
    writeItems(items);
    showToast("Prompt opgeslagen");
  }

  function deleteSelected() {
    if (!state.selectedSavedId) return;

    const filtered = saveItems().filter(x => x.id !== state.selectedSavedId);
    writeItems(filtered);
    state.selectedSavedId = null;
    renderSavedList();
    showScreen("savedScreen");
    showToast("Prompt verwijderd");
  }

  function clearForm() {
    const fieldIds = ["task", "context", "outcome", "manualRole"];
    const hasContent = fieldIds.some(id => normalize($(id).value));

    if (!hasContent) {
      showToast("De invoervelden zijn al leeg");
      return;
    }

    const confirmed = window.confirm(
      "Wil je alle invoervelden leegmaken? Opgeslagen prompts blijven bewaard."
    );
    if (!confirmed) return;

    fieldIds.forEach(id => { $(id).value = ""; });

    const advancedPanel = document.querySelector(".advanced-card");
    if (advancedPanel) advancedPanel.open = false;

    // Wis alleen de tijdelijke, huidige prompt; bewaarde prompts blijven staan.
    state.currentPrompt = "";
    state.currentTitle = "";
    $("promptOutput").textContent = "";
    $("resultStatus").textContent = "";
    $("copyLabel").textContent = "Kopiëren";
    updateHomeButtons();
    showToast("Invoervelden leeggemaakt");
  }

  function updateHomeButtons() {
    const hasTask = Boolean(normalize($("task").value));
    $("copyPromptFromHome").disabled = !hasTask;
    $("showPromptButton").disabled = !hasTask;
    if (hasTask && $("copyPromptFromHomeLabel").textContent.startsWith("Gekopieerd")) {
      $("copyPromptFromHomeLabel").textContent = "Kopiëren";
    }
  }

  function prepareCurrentPrompt() {
    const prompt = generatePrompt();
    if (!prompt) {
      $("task").focus();
      showToast("Vul eerst je opdracht in");
      return "";
    }

    state.currentPrompt = prompt;
    state.currentTitle = makeTitle($("task").value);
    $("promptOutput").textContent = prompt;
    $("copyLabel").textContent = "Kopiëren";
    $("resultStatus").textContent = "";
    return prompt;
  }

  function showCurrentPrompt() {
    if (!prepareCurrentPrompt()) return;
    showScreen("resultScreen");
  }

  async function copyCurrentPromptFromHome() {
    const prompt = prepareCurrentPrompt();
    if (!prompt) return;

    const copied = await copyText(prompt);
    if (copied) {
      $("copyPromptFromHomeLabel").textContent = "Gekopieerd ✓";
      setTimeout(() => {
        if ($("copyPromptFromHomeLabel")) {
          $("copyPromptFromHomeLabel").textContent = "Kopiëren";
        }
      }, 1800);
    }
  }

  function goHome(clearResult = false) {
    if (clearResult) {
      $("promptOutput").textContent = "";
      state.currentPrompt = "";
      state.currentTitle = "";
      $("resultStatus").textContent = "";
      $("copyLabel").textContent = "Kopiëren";
    }
    showScreen("homeScreen");
  }

  $("resetFormButton").addEventListener("click", clearForm);
  $("task").addEventListener("input", updateHomeButtons);
  $("promptForm").addEventListener("submit", event => {
    event.preventDefault();
    showCurrentPrompt();
  });

  $("copyPromptFromHome").addEventListener("click", copyCurrentPromptFromHome);
  $("showPromptButton").addEventListener("click", showCurrentPrompt);

  $("backButton").addEventListener("click", () => goHome());
  $("savedButton").addEventListener("click", () => {
    renderSavedList();
    showScreen("savedScreen");
  });
  $("savedBackButton").addEventListener("click", () => goHome());
  $("savedDetailBackButton").addEventListener("click", () => {
    renderSavedList();
    showScreen("savedScreen");
  });

  $("copyButton").addEventListener("click", async () => {
    if (await copyText(state.currentPrompt)) {
      $("copyLabel").textContent = "Gekopieerd";
      setTimeout(() => $("copyLabel").textContent = "Kopiëren", 1500);
    }
  });

  $("shareButton").addEventListener("click", () => shareText(
    state.currentPrompt,
    "AI Prompt Studio"
  ));

  $("saveButton").addEventListener("click", () => saveCurrentPrompt());

  $("savedCopyButton").addEventListener("click", () =>
    copyText($("savedDetailOutput").textContent)
  );

  $("savedShareButton").addEventListener("click", () =>
    shareText($("savedDetailOutput").textContent, $("savedDetailTitle").textContent)
  );

  $("deleteSavedButton").addEventListener("click", () => {
    if (confirm("Deze opgeslagen prompt verwijderen?")) deleteSelected();
  });

  // Keyboard convenience for desktop testing.
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      $("promptForm").requestSubmit();
    }
  });

  // Register service worker for offline use.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {
        // Offline enhancement is optional; core app remains usable without it.
      });
    });
  }

  updateHomeButtons();
  renderSavedList();
})();
