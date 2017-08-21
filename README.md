# Пример плагина для монитора

* [Описание](#Описание)
* [package.json](#packagejson)
* [Маршрутизация](#Маршрутизация)
* [Лицензирование и права доступа](#Лицензирование-и-права-доступа)
* [API](#api)
* [Примеры](#Примеры)
* [Ссылки](#Ссылки)

## Описание (актуально для монитора версии 6.4.1.120)

Плагин должен быть полноценным модулем в формате npm, самостоятельно реализующим свои зависимости от других модулей.

Каждый плагин запускается в отдельном процессе.
При этом монитор создаёт:

* рабочий каталог, в котором плагин может работать с файлами
* каталог для логов
* сокет, на который будут переправляться запросы, предназначенные плагину. Если плагин должен обрабатывать http запросы, переадресуемые ему монитором, его экземпляр `http.Server` должен слушать этот сокет

После запуска процесса с плагином монитор инициализирует в глобальной области видимости объект [`global.KServerApi`](#api).

## **package.json**

В `package.json` добавлены следующие значимые для монитора поля:

- `route` \<String\> строка URI, определяющая запросы, переадресуемые плагину
- `required_licenses` \<Array\> массив номеров лицензий кодекса, которые должны присутствовать в рег.файле для запуска плагина

В `package.json` плагина должен быть указан список лицензий рег. файла кодекса, которые необходимы для его запуска: 
```
"required_licenses": [4360]
```
Лицензия 4360 выбрана для примера. Перед запуском плагина монитор проверяет наличие всех перечисленных лицензий, и если чего-то не хватает, плагин не будет запущен.

## **Маршрутизация**

Если плагин должен обрабатывать http запросы, в его `package.json` должен присутствовать параметр 
```
"route": "<ROUTE_TEMPLATE>"
```
В этом случае все запросы, подходящие под шаблон, монитор будет переадресовывать плагину.

**Правила задания шаблонов роутинга соответствуют описанным в модуле [router](https://www.npmjs.com/package/router)**

Например, маршрут плагина задан маской
```
"route": "arm"
```
Монитор получил запрос
```
GET /arm/status?name=test
```
Плагину перенаправляется запрос:
```
GET /arm/status?name=test
```

В [репозитории monitor-plugin-sim](https://github.com/monitor-plugin-sim/monitor-plugin-sim) представлен симулятор подсистемы плагинов монитора, отвечающий за маршрутизацию запросов-ответов между монитором и плагином.

<a class="anchor" name="Лицензирование-и-права-доступа" href="#Лицензирование-и-права-доступа"></a>
## **Лицензирование и права доступа**

Каждый плагин должен иметь хотя бы одну лицензию (*см. package.json: required_licenses*). Кроме того, может возникнуть потребность лицензировать какой-либо отдельный функционал плагина.

 *Например: система имеет в своём составе модули (подсистемы) создания и редактирования документов и генерации отчетов и хочется количество рабочих мест для этих функционалов регулировать отдельно друг от друга и от всей системы в целом, (количество рабочих мест на систему в целом __50__, на создание и редактирование документов __12__, на генерацию отчетов __3__), а также имеется функциональность по управлению компонентами системы доступ к которой должен быть просто ограничен (администратором, без ограничения на количество рабочих мест)*.

Для каждого функционала плагина, который должен быть подвергнут лицензированию и/или разграничению прав доступа, необходимо получить номер лицензии *(у разработчиков kserver'а)*.

Перед тем как разрешить доступ к функционалу для конкретного пользователя код плагина должен проверить разрешен ли пользователю такой доступ с помощью метода `KServerApi.CheckAccess`, передав ему id сессии кодекс-сервера или объекта `request` (IncomingMessage) *(см. `pickKServerInfo`)*

*Рекомендации разработчикам плагинов:<br>
Выполнять проверку `KServerApi.CheckAccess` для каждого запроса может оказаться накладно с точки зрения используемых ресурсов сервера. Что бы снизить нагрузку на систему "кэшировать" ответы `KServerApi.CheckAccess` используя, например, токен с коротким (1 минута) временем жизни совместно с механизмом сессий.*


## **API**

### Вспомогательные методы

#### **pickKServerInfo(request)**

* `request` \<IncomingMessage\>

Собирает относящуюся к KServer'у информацию о запросе и помещает её в свойство `KServer` объекта `request` (IncomingMessage):

* `session` идентификатор сессии кодекс-сервера

Пример:

```
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
***

### Методы

[UserInfo](#userinfo) - метод для получения информации о пользователе<br>
[UserList](#userlist) - метод для получения информации о пользователях<br>
[CheckAccess](#checkaccess) - метод для проверки доступа к функционалу<br>
[PickPermissions](#pickpermissions) - метод для проверки доступа к функционалам<br>
[SetLicensedParameter](#setlicensedparameter) - метод для работы с лицензируемыми параметрами<br>
[IncLicensedParameter](#inclicensedparameter) - метод для работы с лицензируемыми параметрами<br>
[CheckLicensedParameter](#checklicensedparameter) - метод для работы с лицензируемыми параметрами<br>
[KodeksDocInfo](#kodeksdocinfo) - метод для получения информации о документе ИС "Кодекс/Техэксперт"<br>
[KodeksProductStatus](#kodeksproductstatus) - метод для получения статуса продукта ИС "Кодекс/Техэксперт"<br>
[SendMail](#sendmail) - метод для отправки почтового сообщения<br>

<a class="anchor" name="userinfo" href="#userinfo"></a>
#### **UserInfo(session)**

Возвращает информацию о пользователе.

* `session` идентификатор сессии пользователя (см. `pickKServerInfo`) или объект `request` (IncomingMessage)
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается объект с информацией о пользователе:
  ```
  {
    authenticated: <Boolean>, // флаг, аутентифицирован ли пользователь
    ip: <id_type>, // если пользователь не аутентифицирован - ip-адрес пользователя (IPv4 или IPv6); если аутентифицирован - идентификатор пользователя в базе сервера
    // если пользователь не аутентифицирован - дальнейшие свойства отсутствуют
    login: <String>, // логин
    groups: <Array>, // массив объектов вида {id: <id_type>, name: <String>}, содержащих идентификаторы и названиям групп, в которые пользователь входит
    name: <String>, // имя пользователя
    email: <String>,
    department: <String>, // подразделение
    position: <String>, // должность
    disabled: <Boolean>, // статус блокировки учётной записи
    expired: <Boolean> // информация об истечении срока действия учётной записи
  }
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:
```
/**
 * @param {string} session
 * @returns {Promise}
 */
global.KServerApi.UserInfo(session)
.then(userinfo => {})
.catch(error => {})
```
***

<a class="anchor" name="userlist" href="#userlist"></a>
#### **UserList(session)**

Возвращает список пользователей.

* `session` идентификатор сессии пользователя (см. `pickKServerInfo`) или объект `request` (IncomingMessage)
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается массив объектов с информацией о пользователях (может быть пустым):
  ```
  [{
    id: <id_type>, // идентификатор пользователя в базе сервера
    login: <String>`, // логин
    groups: <Array>, // массив объектов вида {id: <id_type>, name: <String>}, содержащих идентификаторы и названиям групп, в которые пользователь входит
    name: <String>, // имя пользователя
    email: <String>,
    department: <String>, // подразделение
    position: <String>, // должность
    disabled: <Boolean>, // статус блокировки учётной записи
    expired: <Boolean> // информация об истечении срока действия учётной записи
  }, ...]
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:
```
/**
 * @param {string} session
 * @returns {Promise}
 */
global.KServerApi.UserList(session)
.then(userlist => {})
.catch(error => {})
```
***

<a class="anchor" name="checkaccess" href="#checkaccess"></a>
#### **CheckAccess(featureId, ver, session)**

Проверяет доступ пользователя к указанному функционалу.
Проверяются права доступа и лицензия (валидна, не превышена и т.п., см. *Лицензирование*).
Если доступ предоставлен, то лицензия "захватывается" (если лицензия была захвачена ранее, то обновляется период её использования).

* `featureId` \<Number\> идентификатор функционала, который должен быть проверен
* `ver` <Number> версия функционала (необязательный параметр, по умолчанию `0`).
    Если в качестве `session` указывается id сессии (`<Number>`), то во избежание
    неоднозначности параметр должен быть указан явно.
* `session` идентификатор сессии пользователя (см. *`pickKServerInfo`*) или объект `request` (IncomingMessage)
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается объект:
  ```
  {
    granted: <Bolean>, // флаг: доступ разрешен/запрещён
    reason: <String>   // причина отказа (в случае отказа)
  }
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```
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

<a class="anchor" name="pickpermissions" href="#pickpermissions"></a>
#### **PickPermissions(featuresIds, session)**

Проверяет права доступа пользователя к указанным функционалам, а, так же, если указана версия (см. `featuresIds`) - на лицензию.
Метод не использует (не "захватывает") лицензию, а только проверяет её валидность. (см. *Лицензирование*).

* `featuresIds` \<Array\> массив идентификаторов функционалов и/или пар [<идентификатор функционала>, <версия>],
которые должны быть проверены.
* `session` идентификатор сессии пользователя (см. *`pickKServerInfo`*) или объект `request` (IncomingMessage)
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается массив объектов:
  ```
  [{
    feature: <Any>,    // id функционала
    granted: <Bolean>, // флаг: доступ разрешен/запрещён
    reason: <String>,  // причина отказа (в случае отказа)
    ver: <Number>      // версия (если была в запросе)
  }, ...]
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```
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

<a class="anchor" name="setlicensedparameter" href="#setlicensedparameter"></a>
#### **SetLicensedParameter(license, version, value, owner)**

Устанавливает количество используемых лицензий для указанного владельца.
Если владелец не указан, то он интерпретируется как "анонимный владелец".

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* `value` \<Number\> количество лицензий
* `owner` \<String\> идентификатор владельца
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается \<Boolean\>:
  ```
  <Bolean>  // true - количество используемых лицензий не превышает максимально допустимое
            // false - превышает, но значение всё равно устанавливается
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```
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

<a class="anchor" name="inclicensedparameter" href="#inclicensedparameter"></a>
#### **IncLicensedParameter(license, version, value, owner)**

Изменяет количество используемых лицензий для указанного владельца на значение, указанное в `incVal`.
Если владелец не указан, то он интерпретируется как "анонимный владелец".

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* `value` \<Number\> количество лицензий
* `owner` \<String\> идентификатор владельца
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается `true`.<br>
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```
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

<a class="anchor" name="checklicensedparameter" href="#checklicensedparameter"></a>
#### **CheckLicensedParameter(license, version)**

Проверяет, не превышает ли количество занятых лицензий максимально допустимое.

* `license` \<Number\> номер лицензии
* `version` \<Number\> версия
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается \<Boolean\>:
  ```
  <Bolean>  // true - не превышает; false - превышает
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

Пример:

```
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

<a class="anchor" name="kodeksdocinfo" href="#kodeksdocinfo"></a>
#### **KodeksDocInfo(docNum[, session])**

Возвращает информацию о документе ИС "Кодекс/Техэксперт".

* `docNum` \<Number\> номер документа в ИС "Кодекс/Техэксперт", информацию о котором требуется получить.
* `session` идентификатор сессии пользователя (см. `pickKServerInfo`), или объект `request` (IncomingMessage), или `undefined`
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается объект:
  ```
  {
    status: <String>,  // статус документа
    tooltip: <String>  // наименование документа с дополнительной информацией
  }
  ```
  Свойство `status` может принимать следующие значения:
   *'active', 'inactive', 'card_active', 'card_inactive', 'card_undefined', 'project', 'project inactive', 'situation', 'situation_inactive', 'themes', 'technicalDocument', 'technicalDocumentNew', 'book', 'bookmark', 'imp_news'*<br>
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

***

<a class="anchor" name="kodeksproductstatus" href="#kodeksproductstatus"></a>
#### **KodeksProductStatus(productId[, session])**

* `productId` \<Number\> идентификатор продукта ИС "Кодекс/Техэксперт".
* `session` идентификатор сессии пользователя (см. `pickKServerInfo`), или объект `request` (IncomingMessage), или `undefined`
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается объект:
  ```
  {
    plugged: <Bolean>  // флаг: продукт подключен/не подключен
  }
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.

***

<a class="anchor" name="sendmail" href="#sendmail"></a>
#### **SendMail(to[, subj, body, cc, attachment])**

Отправляет почтовое сообщение

* `to` \<String\> адрес(а) получателя(ей) (обязательный)
* `subj` \<String\> тема письма или `undefined`
* `body` \<String\> текст (тело) письма
* `cc` \<String\> адрес(а) получателя(ей) копии или `undefined`
* `attachment` \<Array\> массив путей (String) прикрепляемых файлов или `undefined`
* Returns: \<Promise\><br>
  Обработчику `resolve` (в случае успеха) передается значение:
  ```
  <Bolean>  // статус завершения операции отправки письма
  ```
  Обработчику `reject` (в случае неудачи) передается объект `Error` c описанием ошибки.



## **Примеры**

- [simple](https://github.com/dev-kodeks/simple-monitor-plugin/tree/master/simple) - пример простого плагина
- [express](https://github.com/dev-kodeks/simple-monitor-plugin/tree/master/express) - пример плагина, использующего [express.js](http://expressjs.com/)

## Ссылки

- [симулятор подсистемы плагинов монитора](https://github.com/dev-kodeks/monitor-plugin-sim)
