# Яндекс Умный дом при включённом VPN — iPhone iOS 26

**Цель:** не отключать VPN для команд `Kitchen_Light_ON.shortcut` и `Kitchen_Light_OFF.shortcut`, а направлять HTTPS-запрос к `api.iot.yandex.net` напрямую.

## Готовое исключение для AmneziaVPN

Файл: [Yandex_Smart_Home_DIRECT_AmneziaVPN.json](./Yandex_Smart_Home_DIRECT_AmneziaVPN.json). В нём **только** `213.180.193.211/32`; OAuth-токен не хранится.

1. Скачайте JSON на iPhone в «Файлы».
2. Откройте **AmneziaVPN → Раздельное туннелирование → По сайтам/IP**.
3. Выберите **«Адреса из списка не должны открываться через VPN»**.
4. Меню **⋮ → Импортировать → Добавить к существующим**. **НЕ** выбирайте «Заменить список» — иначе прежние правила пропадут.
5. Выберите скачанный JSON, включите раздельное туннелирование. При необходимости переподключите VPN **один раз после изменения настроек**.
6. Дальше запускайте команды как обычно, оставляя VPN подключённым.

### Ограничения

- На 22.10.2026 DNS Google и Cloudflare вернул `api.iot.yandex.net → 213.180.193.211` (A). Домен также имеет IPv6 `2a02:6b8::1c2` (AAAA). AmneziaVPN поддерживает **только IPv4** в split tunneling: при выборе iPhone маршрута IPv6 исключение не гарантирует работу.
- При изменении A-записи исключение нужно актуализировать. Проверка на физическом iPhone и работа лампы ещё не проводились (**NOT_TESTED**).
- Не отключайте TLS/проверку сертификатов, не передавайте токен в публичный репозиторий.
- Эта конфигурация для **AmneziaVPN** с IP split tunneling, не для отдельного AmneziaWG и не для Amnezia Free без IP-исключений.

Источники: [документация Amnezia](https://docs.amnezia.org/ru/documentation/instructions/vpn-split-tunneling/), [исходный код обработчика импорта](https://github.com/amnezia-vpn/amnezia-client/blob/dev/client/core/controllers/ipSplitTunnelingController.cpp), [документация Yandex API](https://yandex.ru/dev/dialogs/smart-home/doc/en/concepts/platform-protocol).
