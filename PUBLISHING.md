# Публикация расширения Python Class Navigator

## Подготовка к публикации

### 1. Проверка перед публикацией

```bash
# Убедитесь, что проект компилируется без ошибок
npm run compile

# Проверьте линтер
npm run lint

# Протестируйте расширение (F5 в VS Code)
```

### 2. Обновление метаданных

Отредактируйте `package.json`:

```json
{
  "name": "python-class-navigator",
  "displayName": "Python Class Navigator",
  "description": "Navigate between parent and child classes with gutter icons and CodeLens",
  "version": "0.0.1",
  "publisher": "your-publisher-name",  // ← Добавьте ваше имя издателя
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/python-class-navigator"
  },
  "icon": "icon.png",  // ← Добавьте иконку 128x128px (опционально)
  "keywords": [
    "python",
    "navigation",
    "class",
    "inheritance",
    "codelens"
  ],
  "categories": [
    "Programming Languages"
  ]
}
```

### 3. Создание иконки расширения (опционально)

Создайте `icon.png` (128x128 пикселей) - иконка для маркетплейса VS Code

## Локальная установка (.vsix)

### Создание .vsix пакета

```bash
# Установите vsce (VS Code Extension Manager)
npm install -g @vscode/vsce

# Создайте пакет
vsce package
```

Это создаст файл `python-class-navigator-0.0.1.vsix`

### Установка локально

**Через VS Code:**
1. Откройте Extensions (`Cmd+Shift+X`)
2. Нажмите "..." (три точки вверху)
3. Выберите "Install from VSIX..."
4. Выберите созданный `.vsix` файл

**Через командную строку:**
```bash
code --install-extension python-class-navigator-0.0.1.vsix
```

### Удаление расширения

```bash
code --uninstall-extension your-publisher-name.python-class-navigator
```

## Публикация в VS Code Marketplace

### 1. Создание аккаунта издателя

1. Перейдите на https://marketplace.visualstudio.com/manage
2. Войдите через Microsoft/GitHub аккаунт
3. Создайте нового издателя (publisher)
4. Запомните ID издателя

### 2. Получение Personal Access Token

1. Перейдите на https://dev.azure.com/
2. Нажмите "User settings" → "Personal access tokens"
3. Нажмите "New Token"
4. Настройки:
   - Name: `VS Code Publishing`
   - Organization: `All accessible organizations`
   - Expiration: `Custom defined` (выберите срок)
   - Scopes: `Marketplace` → `Manage`
5. Скопируйте созданный токен (больше не увидите!)

### 3. Логин в vsce

```bash
vsce login your-publisher-name
# Введите Personal Access Token
```

### 4. Публикация

```bash
# Первая публикация
vsce publish

# Или с указанием версии
vsce publish minor  # 0.0.1 → 0.1.0
vsce publish patch  # 0.0.1 → 0.0.2
vsce publish major  # 0.0.1 → 1.0.0

# Или конкретная версия
vsce publish 1.0.0
```

### 5. После публикации

Расширение появится на https://marketplace.visualstudio.com/ через несколько минут.

Пользователи смогут установить его через:
```
Extensions → Search "Python Class Navigator" → Install
```

## Обновление расширения

### 1. Внесите изменения в код

```bash
# Исправьте баги или добавьте функции
npm run compile
```

### 2. Обновите версию

В `package.json`:
```json
{
  "version": "0.0.2"  // Увеличьте версию
}
```

### 3. Обновите CHANGELOG.md

```markdown
## [0.0.2] - 2024-11-04
### Fixed
- Исправлена ошибка с множественным наследованием
### Added
- Добавлена поддержка Python 3.12
```

### 4. Опубликуйте обновление

```bash
vsce publish
```

## Альтернативные способы распространения

### 1. GitHub Releases

```bash
# Создайте релиз на GitHub
git tag v0.0.1
git push origin v0.0.1

# Прикрепите .vsix файл к релизу
```

Пользователи смогут скачать `.vsix` и установить вручную.

### 2. Open VSX Registry (для VSCodium и других)

```bash
# Установите ovsx
npm install -g ovsx

# Создайте аккаунт на https://open-vsx.org/
# Получите access token

# Опубликуйте
ovsx publish -p <your-token>
```

### 3. Корпоративное распространение

Для использования внутри компании:
- Разместите `.vsix` файл на внутреннем сервере
- Инструкция для сотрудников: скачать и установить через "Install from VSIX"

## Мониторинг и аналитика

### Статистика в Marketplace

После публикации доступна статистика:
- Количество установок
- Количество загрузок
- Рейтинг и отзывы
- https://marketplace.visualstudio.com/manage/publishers/your-publisher-name

### Telemetry (опционально)

Добавьте Application Insights для сбора анонимной телеметрии:

```typescript
// В extension.ts
import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

const key = 'your-app-insights-key';
const reporter = new TelemetryReporter(key);

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(reporter);
    reporter.sendTelemetryEvent('extensionActivated');
}
```

## Лицензирование

### Добавьте LICENSE файл

Например, MIT License:

```
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

В `package.json` добавьте:
```json
{
  "license": "MIT"
}
```

## Маркетинг и продвижение

### 1. Улучшите README.md
- Добавьте скриншоты/GIF демонстрации
- Четкое описание возможностей
- Примеры использования
- Сравнение с аналогами

### 2. Создайте демо-видео
- Запись экрана с использованием расширения
- Загрузите на YouTube
- Добавьте ссылку в README

### 3. Продвижение
- Reddit: r/vscode, r/Python
- Twitter/X с хэштегами #VSCode #Python
- Dev.to блог-пост
- Hacker News Show HN

### 4. Соберите обратную связь
- Добавьте ссылку на GitHub Issues в README
- Отвечайте на отзывы в Marketplace
- Собирайте feature requests

## Контрольный список перед публикацией

- [ ] Код компилируется без ошибок
- [ ] Нет предупреждений линтера
- [ ] Расширение протестировано на разных проектах
- [ ] README.md заполнен и содержит примеры
- [ ] package.json содержит правильные метаданные
- [ ] Добавлен LICENSE файл
- [ ] Добавлен CHANGELOG.md
- [ ] Версия обновлена
- [ ] Создан publisher аккаунт
- [ ] Получен Personal Access Token
- [ ] .vsix пакет создается успешно
- [ ] Иконка добавлена (опционально)
- [ ] Скриншоты готовы (опционально)

## Полезные ссылки

- **VS Code Extension API**: https://code.visualstudio.com/api
- **Publishing Extensions**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Extension Marketplace**: https://marketplace.visualstudio.com/vscode
- **Extension Guidelines**: https://code.visualstudio.com/api/references/extension-guidelines
- **vsce Documentation**: https://github.com/microsoft/vscode-vsce

## Команды vsce

```bash
# Создать пакет
vsce package

# Опубликовать
vsce publish

# Показать информацию о расширении
vsce show your-publisher-name.python-class-navigator

# Unpublish (удалить из маркетплейса - осторожно!)
vsce unpublish your-publisher-name.python-class-navigator

# Список версий
vsce ls your-publisher-name.python-class-navigator
```

---

**Удачи с публикацией вашего расширения!** 🚀
