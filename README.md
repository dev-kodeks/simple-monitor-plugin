# Подсистема плагинов для монитора (актуально для версии 6.4.1.144)

* [Описание](#Описание)
* [package.json](#packagejson)
* [Маршрутизация](#Маршрутизация)
* [Настройка виртуального каталога](#Настройка-виртуального-каталога)
* [Обновление](#Обновление)
* [Лицензирование и права доступа](#Лицензирование-и-права-доступа)
* [API](#api)
* [Примеры](#Примеры)
* [Ссылки](#Ссылки)

## Описание

Плагин должен быть полноценным модулем в формате npm, самостоятельно реализующим свои зависимости от других модулей.
Роутингом для плагина является имя каталога (для плагинов в режиме разработчика), или имя файла без расширения.

Каждый плагин запускается в отдельном процессе. Способ запуска, передаваемые плагину аргументы и стандартные потоки процесса плагина можно задавать в поле `process` в [package.json](#packagejson).
Перед запуском процесса плагина монитор:

* проверяет наличие файлов обновлений для плагина и, если они есть, обновляет плагин (см. [обновление](#Обновление))
* создаёт рабочий каталог, в котором плагин может работать с файлами
* (не обязательно) создаёт каталог для логов (в зависимости от настроек в monitor.ini каталог для логов может отсутствовать)

Во время работы монитор отслеживает процесс плагина. Если этот процесс завершается, монитор его перезапускает, заново проводя всю инициализацию. Если процесс плагина завершается во время инициализации, монитор не делает попыток его восстановления.
При инициализации монитор:

* проверяет наличие обязательных для запуска плагина лицензий
* создаёт сокет, на который будут переправляться запросы, предназначенные плагину. Если плагин должен обрабатывать http запросы, переадресуемые ему монитором, его экземпляр `http.Server` должен слушать этот сокет
* создаёт виртуальный каталог, использующий базу plugins.dbs с роутингом, соответствующим правилам роутинга для плагина (см. [настройка виртуального каталога](#Настройка-виртуального-каталога))
* инициализирует в глобальной области видимости объект [`global.KServerApi`](#api).

## **package.json**

В `package.json` добавлены следующие значимые для монитора поля:

* `required_licenses` \<Array\> массив номеров лицензий кодекса, которые должны присутствовать в рег.файле для запуска плагина
* (необязательное) `process` \<Object\> объект, в котором можно задать способ запуска процесса плагина, передаваемые процессу аргументы и его потоки ввода, вывода и ошибок

Объект `process` имеет следующие поля:

* `cmd`     \<String\> строка с командой запуска процесса плагина
* `args`    \<Array\> массив строк, передаваемых как аргументы команде запуска процесса плагина
* `stdin`   \<String\> путь к файлу, представляющему поток ввода для процесса плагина
* `stdout`  \<String\> путь к файлу, представляющему поток вывода для процесса плагина
* `stderr`  \<String\> путь к файлу, представляющему поток ошибок для процесса плагина

Для команды, указанной в `cmd`, путь считается относительно каталога установки ПК.
Для файлов, указанных в полях `stdin`, `stdout`, `stderr`, путь считается относительно каталога логов плагина (см. [KServerApi, поле LogsPath](#Содержимое-объекта-globalkserverapi))

Пример:
  ```javascript
  ...
  "process": {
      "cmd": "nsh.exe",
      "args": [
        "--debug"
      ],
      "stdin": null,
      "stdout": "stdout.txt",
      "stderr": "stderr.txt"
    },
  "required_licenses": [
    111
  ],
  ...
  ```

*Лицензия 111 выбрана для примера.*
Перед запуском плагина монитор проверяет наличие всех перечисленных лицензий, и если чего-то не хватает, плагин не будет запущен.
Первая из указанных лицензий используется как идентификатор сервиса плагина.

## **Маршрутизация**

Маршрутизация запросов к плагину определяется исходя из имени файла (без расширения) или каталога (в режиме разработчика) с плагином. Запрос передаётся в плагин без изменений.

Например, каталог с плагином называется

```javascript
arm
```

Монитор получил запрос

```javascript
GET /arm/status?name=test
```

Плагину перенаправляется запрос:

```javascript
GET /arm/status?name=test
```

В [репозитории monitor-plugin-sim](https://github.com/monitor-plugin-sim/monitor-plugin-sim) представлен симулятор подсистемы плагинов монитора, отвечающий за маршрутизацию запросов-ответов между монитором и плагином.

## **Настройка виртуального каталога**

При инициализации плагина монитор проверяет наличие и тип виртуального каталога, соответствующего роутингу плагина. Если такого каталога нет, он создаётся и ему выставляется тип `Использовать базу plugins.dbs`.
В настройках этого виртуального каталога настраиваются права доступа пользователей к плагину, а также предпочтительный виртуальный каталог для плагина (не обязательно).

## **Обновление**

Если при запуске монитор находит обновление для плагина, он

* проверяет, является ли обновление корректным плагином (если не является, следующие шаги пропускаются)
* останавливает процесс плагина, переводит его роутинг в служебное состояние
* переименовывает файл с текущей версией плагина, меняя ему расширение на текущую дату в формате ДД-ММ-ГГГГ
* переименовывает файл с обновлением плагина в соответствующее плагину имя
* запускает процесс плагина, проводя все необходимые проверки и инициализации (см. [описание](#Описание))
* восстанавливает роутинг запросов к плагину в рабочее состояние

Во время работы ПК может получить обновление для плагина из служебной базы. В этом случае файлы обновления выгружаются в каталог с плагинами и инициируется обновление плагина по представленным выше шагам.

## **Лицензирование и права доступа**

Каждый плагин должен иметь хотя бы одну лицензию (*см. [package.json, поле required_licenses](#packagejson)*). Кроме того, может возникнуть потребность лицензировать какой-либо отдельный функционал плагина.

 *Например: система имеет в своём составе модули (подсистемы) создания и редактирования документов и генерации отчетов и хочется количество рабочих мест для этих функционалов регулировать отдельно друг от друга и от всей системы в целом, (количество рабочих мест на систему в целом __50__, на создание и редактирование документов __12__, на генерацию отчетов __3__), а также имеется функциональность по управлению компонентами системы доступ к которой должен быть просто ограничен (администратором, без ограничения на количество рабочих мест)*.

Для каждого функционала плагина, который должен быть подвергнут лицензированию и/или разграничению прав доступа, необходимо получить номер лицензии *(у разработчиков kserver'а)*.

Перед тем как разрешить доступ к функционалу для конкретного пользователя код плагина должен проверить разрешен ли пользователю такой доступ с помощью метода [`KServerApi.CheckAccess`](#checkaccessfeatureid-ver-session), передав ему id сессии кодекс-сервера или объекта `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage)) *(см. [`pickKServerInfo`](#pickkserverinforequest))*

*Рекомендации разработчикам плагинов:
Выполнять проверку [`KServerApi.CheckAccess`](#checkaccessfeatureid-ver-session) для каждого запроса может оказаться накладно с точки зрения используемых ресурсов сервера. Что бы снизить нагрузку на систему "кэшировать" ответы [`KServerApi.CheckAccess`](#checkaccessfeatureid-ver-session) используя, например, токен с коротким (1 минута) временем жизни совместно с механизмом сессий.*

## **API**

### Вспомогательные методы

#### **pickKServerInfo(request)**

* `request` \<IncomingMessage\>

Собирает относящуюся к KServer'у информацию о запросе и помещает её в свойство `KServer` объекта `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage)):

* `session` идентификатор сессии кодекс-сервера

Пример:

```javascript
app.use((req, res, next) => {
  if (pickKServerInfo)
    pickKServerInfo(req);
  next();
});
//...
app.get('<some_url>', (req, res) => {
  some_api_func(req.KServer.session);
});
```

### Содержимое объекта `global.KServerApi`:

свойства:

* `Name` \<String\> уникальное в пределах монитора имя плагина
* `Path` \<String\> полный путь к плагину
* `StoragePath` \<String\> полный путь к каталогу, в котором предполагается хранение файлов плагинов
* `LogsPath` \<String\> полный путь к каталогу логов плагина
* `SocketPath` \<String\> имя сокета, который должен слушать плагин
* `Info` `package.json` плагина

методы:

* `UserInfo` \<Function\> метод для получения информации о пользователе
* `UserList` \<Function\> метод для получения информации о пользователях
* `CheckAccess` \<Function\> метод для проверки доступа к функционалу
* `PickPermissions` \<Function\> метод для проверки доступа к функционалам
* `KodeksDocInfo` \<Function\> метод для получения информации о документе ИС "Кодекс/Техэксперт"
* `KodeksProductStatus` \<Function\> метод для получения статуса продукта ИС "Кодекс/Техэксперт"
* `SendMail` \<Function\> метод для отправки почтового сообщения
* `GetServerInfo` \<Function\> метод для получения адреса, порта и виртуального каталога

***

### Методы

[UserInfo](#userinfosession) - метод для получения информации о пользователе  
[UserList](#userlistsession) - метод для получения информации о пользователях  
[CheckAccess](#checkaccessfeatureid-ver-session) - метод для проверки доступа к функционалу  
[PickPermissions](#pickpermissionsfeaturesids-session) - метод для проверки доступа к функционалам  
[SetLicensedParameter](#setlicensedparameterlicense-version-value-owner) - метод для работы с лицензируемыми параметрами  
[IncLicensedParameter](#inclicensedparameterlicense-version-value-owner) - метод для работы с лицензируемыми параметрами  
[CheckLicensedParameter](#checklicensedparameterlicense-version) - метод для работы с лицензируемыми параметрами  
[ValidateLicense](#validatelicenselicense-version) - метод для проверки лицензии (наличие, время действия и т.д.)  
[KodeksDocInfo](#kodeksdocinfodocnum-session) - метод для получения информации о документе ИС "Кодекс/Техэксперт"  
[KodeksProductStatus](#kodeksproductstatusproductid-session) - метод для получения статуса продукта ИС "Кодекс/Техэксперт"  
[SendMail](#sendmailto-subj-body-cc-attachment) - метод для отправки почтового сообщения  
[GetServerInfo](#getserverinfo) - метод для получения адреса, порта и виртуального каталога  

#### **UserInfo(session)**

Возвращает информацию о пользователе.

* `session` идентификатор сессии пользователя (см. [`pickKServerInfo`](#pickkserverinforequest)) или объект `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage))
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается объект с информацией о пользователе:
  ```javascript
  {
    authenticated: <Boolean>, // флаг, аутентифицирован ли пользователь
    ip: <id_type>,            // если пользователь не аутентифицирован - ip-адрес пользователя (IPv4 или IPv6); если аутентифицирован - идентификатор пользователя в базе сервера
                              // если пользователь не аутентифицирован - дальнейшие свойства отсутствуют
    login: <String>,          // логин
    groups: <Array>,          // массив объектов вида {id: <id_type>, name: <String>}, содержащих идентификаторы и названиям групп, в которые пользователь входит
    name: <String>,           // имя пользователя
    email: <String>,
    department: <String>,     // подразделение
    position: <String>,       // должность
    disabled: <Boolean>,      // статус блокировки учётной записи
    expired: <Boolean>        // информация об истечении срока действия учётной записи
  }
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```javascript
/**
 * @param {string} session
 * @returns {Promise}
 */
global.KServerApi.UserInfo(session)
.then(userinfo => {})
.catch(error => {})
```

***

#### **UserList(session)**

Возвращает список пользователей.

* `session` идентификатор сессии пользователя (см. [`pickKServerInfo`](#pickkserverinforequest)) или объект `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage))
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается массив объектов с информацией о пользователях (может быть пустым):
  ```javascript
  [{
    id: <id_type>,         // идентификатор пользователя в базе сервера
    login: <String>,       // логин
    groups: <Array>,       // массив объектов вида {id: <id_type>, name: <String>}, содержащих идентификаторы и названиям групп, в которые пользователь входит
    name: <String>,        // имя пользователя
    email: <String>,
    department: <String>,  // подразделение
    position: <String>,    // должность
    disabled: <Boolean>,   // статус блокировки учётной записи
    expired: <Boolean>     // информация об истечении срока действия учётной записи
  }, ...]
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```javascript
/**
 * @param {string} session
 * @returns {Promise}
 */
global.KServerApi.UserList(session)
.then(userlist => {})
.catch(error => {})
```

***

#### **CheckAccess(featureId, ver, session)**

Проверяет доступ пользователя к указанному функционалу.
Проверяются права доступа и лицензия (валидна, не превышена и т.п., см. *Лицензирование*).
Если доступ предоставлен, то лицензия "захватывается" (если лицензия была захвачена ранее, то обновляется период её использования).

* `featureId` \<Number\> идентификатор функционала, который должен быть проверен
* `ver` \<Number\> версия функционала (необязательный параметр, по умолчанию `0`).
    Если в качестве `session` указывается id сессии (`<Number>`), то во избежание
    неоднозначности параметр должен быть указан явно.
* `session` идентификатор сессии пользователя (см. [`pickKServerInfo`](#pickkserverinforequest)) или объект `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage))
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается объект:

```javascript
  {
    granted: <Bolean>,  // флаг: доступ разрешен/запрещён
    reason: <String>    // причина отказа (в случае отказа)
  }
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

  ```javascript
//...
app.get('<some_url>', (req, res, next) => {
  KServerApi.CheckAccess(555000, req)
  .then(access => {
    if (!access.granted) {
      accessDenyHandler(req, res, access.reason);
      return;
    }
    next();
  })
  .catch(error => {
    accessDenyHandler(req, res, error);
  })
});
```

***

#### **PickPermissions(featuresIds, session)**

Проверяет права доступа пользователя к указанным функционалам, а, так же, если указана версия (см. `featuresIds`) - на лицензию.
Метод не использует (не "захватывает") лицензию, а только проверяет её валидность. (см. *Лицензирование*).

* `featuresIds` \<Array\> массив идентификаторов функционалов и/или пар [<идентификатор функционала>, <версия>], которые должны быть проверены.
* `session` идентификатор сессии пользователя (см. [`pickKServerInfo`](#pickkserverinforequest)) или объект `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage))
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается массив объектов:
  ```javascript
  [{
    feature: <Any>,    // id функционала
    granted: <Bolean>, // флаг: доступ разрешен/запрещён
    reason: <String>,  // причина отказа (в случае отказа)
    ver: <Number>      // версия (если была в запросе)
  }, ...]
  ```

  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.
  Пример:
  ```javascript
  //...
  KServerApi.PickPermissions([
    [555100000, 0], ['555100000', '1'], 555100001, '555100002'
  ], req)
  .then(permissions => {
    // process permissions
    // ...
  })
  .catch(error => {
    // error handler
    // ...
  })
  ```

***

#### **SetLicensedParameter(license, version, value, owner)**

Устанавливает количество используемых лицензий для указанного владельца.
Если владелец не указан, то он интерпретируется как "анонимный владелец".

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* `value` \<Number\> количество лицензий
* `owner` \<String\> идентификатор владельца
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается \<Boolean\>:
  ```javascript
  <Bolean>  // true - количество используемых лицензий не превышает максимально допустимое
            // false - превышает, но значение всё равно устанавливается
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```javascript
//...
app.get('<some_url>', (req, res, next) => {
  KServerApi.SetLicensedParameter(100002, 0, 50, 123456789)
  .then(result => {
    if (!result)
      console.log("Licensed parameter was set with 'overuse' status.");
    next();
  })
  .catch(error => {
    else
      console.log("Licensed parameter was not been set.")
  })
});

```

***

#### **IncLicensedParameter(license, version, value, owner)**

Изменяет количество используемых лицензий для указанного владельца на значение, указанное в `incVal`.
Если владелец не указан, то он интерпретируется как "анонимный владелец".

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* `value` \<Number\> количество лицензий
* `owner` \<String\> идентификатор владельца
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается `true`.    
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```javascript
//...
app.get('<some_url>', (req, res, next) => {
  KServerApi.IncLicensedParameter(100002, 0, 5, 123456789)
  .then(result => {
    // `result` is unused (always `true`)
    next();
  })
  .catch(error => {
    // 'User limit' or another reason
    accessDenyHandler(req, res, error);
  })
});

```

***

#### **CheckLicensedParameter(license, version)**

Проверяет, не превышает ли количество занятых лицензий максимально допустимое.

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается \<Boolean\>:
  ```javascript
  <Bolean>  // true - не превышает; false - превышает
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```javascript
//...
app.get('<some_url>', (req, res, next) => {
  KServerApi.CheckLicensedParameter(100002)
  .then(result => {
    if (!result) { // 'User limit'
      accessDenyHandler(req, res);
      return;
    }
    next();
  })
  .catch(error => {
    // another reason
    accessDenyHandler(req, res, error);
  })
});

```

***

#### **ValidateLicense(license, version)**

Проверяет валидность лицензии (наличие, время действия и т.д.).

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается \<Boolean\>:
  ```javascript
  <Bolean>  // true - лицензия действующая; false - не действующая или отстутствует
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```javascript
//...
app.get('<some_url>', (req, res, next) => {
  KServerApi.ValidateLicense(100002)
  .then(result => {
    if (!result) { // license not valid
      denyHandler(req, res);
      return;
    }
    next();
  })
  .catch(error => {
    // another reason
    denyHandler(req, res, error);
  })
});

```

***

#### **KodeksDocInfo(docNum[, session])**

Возвращает информацию о документе ИС "Кодекс/Техэксперт".

* `docNum` \<Number\> номер документа в ИС "Кодекс/Техэксперт", информацию о котором требуется получить.
* `session` идентификатор сессии пользователя (см. [`pickKServerInfo`](#pickkserverinforequest)), или объект `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage)), или `undefined`
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается объект:
  ```javascript
  {
    status: <String>,  // статус документа
    tooltip: <String>  // наименование документа с дополнительной информацией
  }
  ```
  Свойство `status` может принимать следующие значения:
   *'active', 'inactive', 'card_active', 'card_inactive', 'card_undefined', 'project', 'project inactive', 'situation', 'situation_inactive', 'themes', 'technicalDocument', 'technicalDocumentNew', 'book', 'bookmark', 'imp_news'*    
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

***

#### **KodeksProductStatus(productId[, session])**

* `productId` \<Number\> идентификатор продукта ИС "Кодекс/Техэксперт".
* `session` идентификатор сессии пользователя (см. [`pickKServerInfo`](#pickkserverinforequest)), или объект `request` ([IncomingMessage](https://nodejs.org/dist/v4.4.3/docs/api/http.html#http_class_http_incomingmessage)), или `undefined`
* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается объект:
  ```javascript
  {
    plugged: <Bolean>  // флаг: продукт подключен/не подключен
  }
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

***

#### **SendMail(to[, subj, body, cc, attachment])**

Отправляет почтовое сообщение

* `to` \<String\> адрес(а) получателя(ей) (обязательный)
* `subj` \<String\> тема письма или `undefined`
* `body` \<String\> текст (тело) письма
* `cc` \<String\> адрес(а) получателя(ей) копии или `undefined`
* `attachment` \<Array\> массив путей (String) прикрепляемых файлов или `undefined`
* Returns: \<Promise\>  
  Обработчику `resolve` (в случае успеха) передается значение:
  ```javascript
  <Bolean>  // статус завершения операции отправки письма
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

***

#### **GetServerInfo()**

Получение адреса, порта и виртуального каталога сервера

* Returns: \<Promise\>    
  Обработчику `resolve` (в случае успеха) передается объект:
  ```javascript
  {
    Port: <Number>,          // порт
    Hostname: <String>,      // имя хоста
    Protocol: <String>       // протокол
    Host: <String>           // полный путь к хосту, включая порт
    PreferredVDir: <String>  // предпочтительный виртуальный каталог
  }
  ```
  Если PreferredVDir не установлен, или во время его получения произошла ошибка, поле будет содержать пустую строку.    
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

## **Примеры**

* [simple](https://github.com/dev-kodeks/simple-monitor-plugin/tree/master/simple) - пример простого плагина
* [express](https://github.com/dev-kodeks/simple-monitor-plugin/tree/master/express) - пример плагина, использующего [express.js](http://expressjs.com/)

## Ссылки

* [симулятор подсистемы плагинов монитора](https://github.com/dev-kodeks/monitor-plugin-sim)
