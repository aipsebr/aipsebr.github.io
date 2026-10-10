# AI Prompt Studio — iPhone PWA

Een mobiele, algemene versie van AI Prompt Studio.

## Inbegrepen
- Mobiel-first interface voor iPhone
- Alleen drie invoervelden: Opdracht, Context, Gewenst resultaat
- Geavanceerde, ingeklapte handmatige rol
- Promptgeneratie volledig lokaal in de browser
- Startpagina met twee acties: Copy (maakt en kopieert direct) en Tonen (opent het resultaatscherm)
- Resultaatscherm met Kopiëren en Delen
- Opgeslagen prompts via localStorage
- Offline cache via Service Worker
- PWA manifest en iPhone-iconen
- Donkere modus via de systeeminstelling
- Portretoriëntatie
- Geen account, server, analytics of AI-API

## Belangrijk voor gebruik op iPhone
De PWA moet vanaf een echte HTTPS-website worden aangeboden. Open de URL in Safari op de iPhone en kies:
Delen → Zet op beginscherm → Open als webapp → Voeg toe.

Vanaf iOS 26 wordt een website die aan het beginscherm wordt toegevoegd standaard als webapp geopend; de manifest- en offlineondersteuning blijven wel nuttig voor de app-ervaring. De huidige iPhone gebruikt voor deze stappen Safari.
