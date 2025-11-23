# Family Reminder Hub

Prosta aplikacja w JavaScript, która pozwala administratorowi tworzyć listę osób oraz planować przypomnienia wysyłane e‑mailem, SMS-em lub telefonicznie. Dane przechowywane są lokalnie w przeglądarce (LocalStorage).

## Funkcje
- Dodawanie osób z imieniem, adresem e-mail i numerem telefonu.
- Tworzenie przypomnień z wyborem odbiorcy, kanału (email/SMS/telefon), treści wiadomości oraz daty i godziny wysłania.
- Podgląd zaplanowanych powiadomień z filtrowaniem po osobie i kanale.
- Wysyłanie powiadomień: tryb symulacji (bez backendu) lub POST do własnego webhooka.
- Automatyczna próba wysłania po upływie terminu oraz ręczny przycisk „Wyślij teraz”.
- Historia wysyłek z informacją o statusie i ewentualnych błędach.

## Jak uruchomić
1. Otwórz `index.html` w przeglądarce.
2. Dodaj osoby w sekcji „Dodaj osobę”.
3. Utwórz przypomnienie, wybierając osobę, kanał, treść oraz termin wysyłki.
4. Skonfiguruj sekcję „Ustawienia wysyłki”:
   - pozostaw puste „Webhook do wysyłki (POST)” lub włącz „Tryb symulacji”, aby zapisywać wysyłki tylko lokalnie;
   - podaj adres webhooka oraz (opcjonalnie) nagłówek Authorization, aby realnie wysyłać dane.
5. Korzystaj z filtrów w sekcji „Twoje przypomnienia”, aby szybko znaleźć właściwe wpisy.
6. Monitoruj status w kartach oraz historię w logu wysyłek. Aplikacja co 30 s automatycznie wyśle wszystkie przeterminowane, niewysłane wpisy; możesz też kliknąć „Wyślij teraz”.

### Format webhooka
Żądanie HTTP POST ma nagłówek `Content-Type: application/json` oraz opcjonalny `Authorization`. Treść:

```json
{
  "person": {
    "id": "...",
    "name": "...",
    "email": "...",
    "phone": "..."
  },
  "reminder": {
    "channel": "email|sms|telefon",
    "message": "...",
    "schedule": "2025-11-26T12:00"
  }
}
```

Odpowiedź 2xx oznacza poprawną wysyłkę. W przypadku błędu status karty i log otrzyma komunikat zwrócony z fetch/HTTP.
