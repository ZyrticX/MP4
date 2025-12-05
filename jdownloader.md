asics
Introduction
This document specifies the development state of the MyJDownloader API. As the API changes regularly, changes in this document will happen every so often. The API is designed to offer a secure communication between the JDownloader client and the request client, and to prevent any man in the middle listeners. For this approach the API is using AES128CBC and HMAC-SHA256. To be able to communicate with the API we would suggest to make sure you understand the procedure as this can get somewhat complicated for beginners. The API is REST based, but currently only GET and POST routes are offered.

Communication
API Endpoint: https://api.jdownloader.org
To avoid problems with NAT and Portforwarding, the communication between the frontends and JDownloader is routed through our Connection-Server. IF available, the frontend will try to establish a direct connection between the frontend and JDownloader after validating the account credentials and initializing the encryption tokens.
Pro Tip: It's possible to access the JDownloader API directly (Bypass our server) by enabling the so called 'Deprecated API' in the Advanced Options.

Common Mistakes
If things do not work as expected, please check the common mistakes section first.

Parameter Order
The parameter in GET/POST requests are important. Use the documented order or you won't get a positive response.

Content-Type Header & JSON Syntax
Make sure to use the correct Content-Type. For most calls, this is application/json; charset=utf-8, see call description

The API expects JSON Input and will return JSON output. Make sure that you send valid JSON formatted text.
We highly recommend, that you use a JSON Library to create proper JSON, and parse the results. The results syntax of existing methods MAY CHANGE, but the content structure and field names will remain. (e.g. we might add a field, or shuffle fields, but we will not rename or remove an existing field. This way, the API will stay compatible)

Always provide a new RequestID
The RequestID is required in almost every request. It's a number that has to increase from one call to another. You can either use a millisecond precise timestamp, or a self incrementing number. The API will return the RequestID in the response. You should validate the response to make sure the answer is valid.

Field names
Make sure that you use the correct field names.

WRONG!
	/downloadsV2/queryLinks?{"packageUUID":[1468427395088]}
	
CORRECT!
	/downloadsV2/queryLinks?{"packageUUIDs":[1468427395088]}
	
URL-Encoding
Make sure all url parameters are correctly urlencoded.

Signature
Most calls require a signature that validates the call against our server and your JDownloader. The API will only accept calls with a proper signature.
Create the Signature:

build the full queryString (incl. RequestID)
hmac the queryString. The used Key depends. Some calls use serverEncryptionToken, others have to ask the user for email and password, create the loginSecret and use the loginsecret as key. email needs to be lower case!
hexformat the result
append the signature to the queryString &signature=.
Example:
queryString = "/my/connect?email=foo@bar.com&rid=1361982773157";
queryString += "&signature=" + HmacSha256(utf8bytes(queryString), ServerEncryptionToken);

Errors & Exceptions
All HTTP Response codes except 200 are errors or exceptions. The response content contains an ErrorObject in this case. Errors can have different origins. Depending on the call, the Connection Server or the JDownloader installation might throw an error. Check the 'src' field to get the origin.

{
"src":"MYJD"|"DEVICE"  
"type":<see errortypes below>
"data":<Optional Data Object>
}

Device Error Types
Device Errors' origin is a JDownloader installation.

"src":"DEVICE"
HTTP Response Code: 403 SESSION
HTTP Response Code: 404 API_COMMAND_NOT_FOUND
HTTP Response Code: 403 AUTH_FAILED
HTTP Response Code: 404 FILE_NOT_FOUND
HTTP Response Code: 500 INTERNAL_SERVER_ERROR
HTTP Response Code: 404 API_INTERFACE_NOT_FOUND
HTTP Response Code: 400 BAD_PARAMETERS
Server Error Types
Server Errors' origin is the Connection Server

"src":"MYJD"
HTTP Response Code: 503 MAINTENANCE
HTTP Response Code: 503 OVERLOAD
HTTP Response Code: 429 TOO_MANY_REQUESTS
HTTP Response Code: 401 ERROR_EMAIL_NOT_CONFIRMED
HTTP Response Code: 403 OUTDATED
HTTP Response Code: 403 TOKEN_INVALID
HTTP Response Code: 504 OFFLINE
HTTP Response Code: 500 UNKNOWN
HTTP Response Code: 400 BAD_REQUEST
HTTP Response Code: 403 AUTH_FAILED
HTTP Response Code: 500 EMAIL_INVALID
HTTP Response Code: 500 CHALLENGE_FAILED
HTTP Response Code: 500 METHOD_FORBIDDEN
HTTP Response Code: 500 EMAIL_FORBIDDEN
HTTP Response Code: 500 FAILED
HTTP Response Code: 500 STORAGE_NOT_FOUND
HTTP Response Code: 500 STORAGE_LIMIT_REACHED
HTTP Response Code: 500 STORAGE_ALREADY_EXISTS
HTTP Response Code: 500 STORAGE_INVALID_KEY
HTTP Response Code: 500 STORAGE_KEY_NOT_FOUND
HTTP Response Code: 500 STORAGE_INVALID_STORAGEID
Account Management
Create/Register an account
1. Get Captcha Challenge
Call/captcha/getCaptcha
Return type/captcha/getCaptcha
Possible ErrorsOVERLOAD
 MAINTENANCE
 TOO_MANY_REQUESTS
Response Content

{ 
"captchaChallenge" :	"13650058317(...)8299d97cf5",
"image" : 		"data:image/png;base64,iVBORw0KGgoCAYAA(...)"
}
2. Register
3. Finish Registration
Methods
Namespace /
flashParameter: 0
Call/flash
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
crossdomain.xmlParameter: 0
Call/crossdomain.xml
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
favicon.icoParameter: 0
Call/favicon.ico
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
flashgotParameter: 0
Call/flashgot
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
jdcheck.jsParameter: 0
Call/jdcheck.js
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
jdcheckjsonParameter: 0
Call/jdcheckjson
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
Namespace /accounts
addAccountParameter: 3
Parameter1 - premiumHoster (String)
 2 - username (String)
 3 - password (String)
Call/accounts/addAccount?premiumHoster&username&password
Return typeboolean
disableAccountsParameter: 1
Parameter1 - ids (List)
Call/accounts/disableAccounts?ids
Return typeboolean
enableAccountsParameter: 1
Parameter1 - ids (List)
Call/accounts/enableAccounts?ids
Return typeboolean
getAccountInfoParameter: 1
Parameter1 - id (long)
Call/accounts/getAccountInfo?id
Return typeAccount
getPremiumHosterUrlParameter: 1
Parameter1 - hoster (String)
Call/accounts/getPremiumHosterUrl?hoster
Return typeString
listPremiumHosterParameter: 0
Call/accounts/listPremiumHoster
Return typeList<String>
listPremiumHosterUrlsParameter: 0
Call/accounts/listPremiumHosterUrls
Return typeJsonMap
premiumHosterIconParameter: 1
Parameter1 - premiumHoster (String)
Call/accounts/premiumHosterIcon?premiumHoster
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
queryAccountsParameter: 1
Parameter1 - query (APIQuery)
Call/accounts/queryAccounts?query
Return typeList<Account>
removeAccountsParameter: 1
Parameter1 - ids (Long[])
Call/accounts/removeAccounts?ids
Return typeboolean
setEnabledStateParameter: 2
Parameter1 - enabled (boolean)
 2 - ids (Long[])
Call/accounts/setEnabledState?enabled&ids
Return typeboolean
updateAccountParameter: 3
Parameter1 - accountId (Long)
 2 - username (String)
 3 - password (String)
Call/accounts/updateAccount?accountId&username&password
Return typeboolean
Namespace /accountsV2
addAccountParameter: 3
Parameter1 - premiumHoster (String)
 2 - username (String)
 3 - password (String)
Call/accountsV2/addAccount?premiumHoster&username&password
addBasicAuthParameter: 4
Parameter1 - type (Type)
 2 - hostmask (String)
 3 - username (String)
 4 - password (String)
Call/accountsV2/addBasicAuth?type&hostmask&username&password
Return typelong
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
disableAccountsParameter: 1
Parameter1 - ids (long[])
Call/accountsV2/disableAccounts?ids
enableAccountsParameter: 1
Parameter1 - ids (long[])
Call/accountsV2/enableAccounts?ids
getPremiumHosterUrlParameter: 1
Parameter1 - hoster (String)
Call/accountsV2/getPremiumHosterUrl?hoster
Return typeString
listAccountsParameter: 1
Parameter1 - query (AccountQuery)
Call/accountsV2/listAccounts?query
Return typeList<Account>
listBasicAuthParameter: 0
Call/accountsV2/listBasicAuth
Return typeList<BasicAuthentication>
listPremiumHosterParameter: 0
Call/accountsV2/listPremiumHoster
Return typeList<String>
listPremiumHosterUrlsParameter: 0
Call/accountsV2/listPremiumHosterUrls
Return typeMap<String, String>
refreshAccountsParameter: 1
Parameter1 - ids (long[])
Call/accountsV2/refreshAccounts?ids
removeAccountsParameter: 1
Parameter1 - ids (long[])
Call/accountsV2/removeAccounts?ids
removeBasicAuthsParameter: 1
Parameter1 - ids (long[])
Call/accountsV2/removeBasicAuths?ids
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setUserNameAndPasswordParameter: 3
Parameter1 - accountId (long)
 2 - username (String)
 3 - password (String)
Call/accountsV2/setUserNameAndPassword?accountId&username&password
Return typeboolean
updateBasicAuthParameter: 1
Parameter1 - updatedEntry (BasicAuthentication)
Call/accountsV2/updateBasicAuth?updatedEntry
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
Namespace /captcha
getParameter: 1
Parameter1 - id (long)
DescriptionReturns Captcha Image as Base64 encoded data url
Call/captcha/get?id
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
 ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
getParameter: 2
Parameter1 - id (long)
 2 - format (String)
DescriptionReturns Captcha Image as Base64 encoded data url
Call/captcha/get?id&format
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
 ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
getCaptchaJobParameter: 1
Parameter1 - id (long)
DescriptionReturns CaptchaJob Object for the given id
Call/captcha/getCaptchaJob?id
Return typeCaptchaJob
Possible Error(s)ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
listParameter: 0
Descriptionreturns a list of all available captcha jobs
Call/captcha/list
Return typeList<CaptchaJob>
skipParameter: 2
Parameter1 - id (long)
 2 - type (SkipRequest)
Call/captcha/skip?id&type
Return typeboolean
Possible Error(s)ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
skipParameter: 1
DEPRECATED Method. This method will be removed soon. DO NOT USE IT!

Parameter1 - id (long)
Call/captcha/skip?id
Return typeboolean
Possible Error(s)ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
solveParameter: 3
Parameter1 - id (long)
 2 - result (String)
 3 - resultFormat (String)
Call/captcha/solve?id&result&resultFormat
Return typeboolean
Possible Error(s)ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
 ResponseCode 404 (Not Found); Type:UNKNOWN_CHALLENGETYPE; Description:
solveParameter: 2
Parameter1 - id (long)
 2 - result (String)
Call/captcha/solve?id&result
Return typeboolean
Possible Error(s)ResponseCode 404 (Not Found); Type:NOT_AVAILABLE
 ResponseCode 404 (Not Found); Type:UNKNOWN_CHALLENGETYPE; Description:
Namespace /captchaforward
createJobRecaptchaV2Parameter: 4
Parameter1 - String
 2 - String
 3 - String
 4 - String
Call/captchaforward/createJobRecaptchaV2?String&String&String&String
Return typelong
getResultParameter: 1
Parameter1 - long
Call/captchaforward/getResult?long
Return typeString
Possible Error(s)ResponseCode 404 (Not Found); Type:Not Found
 ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
Namespace /config
getParameter: 3
Parameter1 - interfaceName (String)
 2 - storage (String)
 3 - key (String)
Descriptionget value from interface by key
Call/config/get?interfaceName&storage&key
Return typeObject
getDefaultParameter: 3
Parameter1 - interfaceName (String)
 2 - storage (String)
 3 - key (String)
Descriptionget default value from interface by key
Call/config/getDefault?interfaceName&storage&key
Return typeObject
listParameter: 0
Descriptionlist all available config entries
Call/config/list
Return typeList<AdvancedConfigAPIEntry>
listParameter: 5
Parameter1 - pattern (String)
 2 - returnDescription (boolean)
 3 - returnValues (boolean)
 4 - returnDefaultValues (boolean)
 5 - returnEnumInfo (boolean)
Descriptionlist entries based on the pattern regex
Call/config/list?pattern&returnDescription&returnValues&returnDefaultValues&returnEnumInfo
Return typeList<AdvancedConfigAPIEntry>
listParameter: 4
DEPRECATED Method. This method will be removed soon. DO NOT USE IT!

Parameter1 - pattern (String)
 2 - returnDescription (boolean)
 3 - returnValues (boolean)
 4 - returnDefaultValues (boolean)
DescriptionDEPRECATED! list entries based on the pattern regex
Call/config/list?pattern&returnDescription&returnValues&returnDefaultValues
Return typeList<AdvancedConfigAPIEntry>
listEnumParameter: 1
Parameter1 - type (String)
Descriptionlist all possible enum values
Call/config/listEnum?type
Return typeList<EnumOption>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
queryParameter: 1
Parameter1 - query (AdvancedConfigQuery)
Call/config/query?query
Return typeList<AdvancedConfigAPIEntry>
resetParameter: 3
Parameter1 - interfaceName (String)
 2 - storage (String)
 3 - key (String)
Descriptionreset interface by key to its default value
Call/config/reset?interfaceName&storage&key
Return typeboolean
setParameter: 4
Parameter1 - interfaceName (String)
 2 - storage (String)
 3 - key (String)
 4 - value (Object)
Descriptionset value to interface by key
Call/config/set?interfaceName&storage&key&value
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:INVALID_VALUE
Namespace /content
faviconParameter: 1
DEPRECATED Method. This method will be removed soon. DO NOT USE IT!

Parameter1 - hostername (String)
Call/content/favicon?hostername
Possible Error(s)FileNotFoundException
 ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
fileIconParameter: 1
DEPRECATED Method. This method will be removed soon. DO NOT USE IT!

Parameter1 - filename (String)
Call/content/fileIcon?filename
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
Namespace /contentV2
getFavIconParameter: 1
Parameter1 - hostername (String)
Call/contentV2/getFavIcon?hostername
Possible Error(s)ResponseCode 404 (Not Found); Type:FILE_NOT_FOUND
 ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
getFileIconParameter: 1
Parameter1 - filename (String)
Call/contentV2/getFileIcon?filename
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
getIconParameter: 2
Parameter1 - key (String)
 2 - size (int)
Call/contentV2/getIcon?key&size
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
 ResponseCode 404 (Not Found); Type:FILE_NOT_FOUND
 ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS
getIconDescriptionParameter: 1
Parameter1 - key (String)
Call/contentV2/getIconDescription?key
Return typeIconDescriptor
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
Namespace /device
getDirectConnectionInfosParameter: 0
Call/device/getDirectConnectionInfos
Return typeDirectConnectionInfos
getSessionPublicKeyParameter: 0
Call/device/getSessionPublicKey
Return typeString
pingParameter: 0
Call/device/ping
Return typeboolean
Namespace /dialogs
answerParameter: 2
Parameter1 - id (long)
 2 - data (Map)
Call/dialogs/answer?id&data
Possible Error(s)ResponseCode 400 (Bad Request); Type:Answer Dialog 0 first
 ResponseCode 400 (Bad Request); Type:Invalid ID: 0
getParameter: 3
Parameter1 - id (long)
 2 - icon (boolean)
 3 - properties (boolean)
Call/dialogs/get?id&icon&properties
Return typeDialogInfo
Possible Error(s)ResponseCode 400 (Bad Request); Type:Invalid ID: 0
getTypeInfoParameter: 1
Parameter1 - dialogType (String)
Call/dialogs/getTypeInfo?dialogType
Return typeDialogTypeInfo
Possible Error(s)ResponseCode 400 (Bad Request); Type:Requested Type not found!
listParameter: 0
Call/dialogs/list
Return typelong[]
Namespace /downloadcontroller
forceDownloadParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/downloadcontroller/forceDownload?linkIds&packageIds
getCurrentStateParameter: 0
Call/downloadcontroller/getCurrentState
Return typeString
getSpeedInBpsParameter: 0
Call/downloadcontroller/getSpeedInBps
Return typeint
pauseParameter: 1
Parameter1 - value (boolean)
Call/downloadcontroller/pause?value
Return typeboolean
startParameter: 0
Call/downloadcontroller/start
Return typeboolean
stopParameter: 0
Call/downloadcontroller/stop
Return typeboolean
Namespace /downloadevents
queryLinksParameter: 2
Parameter1 - queryParams (LinkQuery)
 2 - diffID (int)
Call/downloadevents/queryLinks?queryParams&diffID
Return typeDownloadListDiff
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setStatusEventIntervalParameter: 2
Parameter1 - channelID (long)
 2 - interval (long)
Call/downloadevents/setStatusEventInterval?channelID&interval
Return typeboolean
Namespace /downloads
disableLinksParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/downloads/disableLinks?linkIds&packageIds
Return typeboolean
disableLinksParameter: 1
Parameter1 - linkIds (List)
Call/downloads/disableLinks?linkIds
Return typeboolean
enableLinksParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/downloads/enableLinks?linkIds&packageIds
Return typeboolean
enableLinksParameter: 1
Parameter1 - linkIds (List)
Call/downloads/enableLinks?linkIds
Return typeboolean
forceDownloadParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/downloads/forceDownload?linkIds&packageIds
Return typeboolean
forceDownloadParameter: 1
Parameter1 - linkIds (List)
Call/downloads/forceDownload?linkIds
Return typeboolean
getChildrenChangedParameter: 1
Parameter1 - structureWatermark (Long)
Call/downloads/getChildrenChanged?structureWatermark
Return typeLong
getJDStateParameter: 0
Call/downloads/getJDState
Return typeString
moveLinksParameter: 1
Parameter1 - query (APIQuery)
Call/downloads/moveLinks?query
Return typeboolean
movePackagesParameter: 1
Parameter1 - query (APIQuery)
Call/downloads/movePackages?query
Return typeboolean
packageCountParameter: 0
Call/downloads/packageCount
Return typeint
pauseParameter: 1
Parameter1 - value (boolean|null)
Call/downloads/pause?value
Return typeboolean
queryLinksParameter: 1
Parameter1 - queryParams (APIQuery)
Call/downloads/queryLinks?queryParams
Return typeList<DownloadLink>
queryPackagesParameter: 1
Parameter1 - queryParams (APIQuery)
Call/downloads/queryPackages?queryParams
Return typeList<FilePackage>
removeLinksParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/downloads/removeLinks?linkIds&packageIds
Return typeboolean
removeLinksParameter: 1
Parameter1 - linkIds (List)
Call/downloads/removeLinks?linkIds
Return typeboolean
renamePackageParameter: 2
Parameter1 - packageId (Long)
 2 - newName (String)
Call/downloads/renamePackage?packageId&newName
Return typeboolean
resetLinksParameter: 1
Parameter1 - linkIds (List)
Call/downloads/resetLinks?linkIds
Return typeboolean
resetLinksParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/downloads/resetLinks?linkIds&packageIds
Return typeboolean
speedParameter: 0
Call/downloads/speed
Return typeint
startParameter: 0
Call/downloads/start
Return typeboolean
stopParameter: 0
Call/downloads/stop
Return typeboolean
Namespace /downloadsV2
cleanupParameter: 5
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
 3 - action (Action)
 4 - mode (Mode)
 5 - selectionType (SelectionType)
Call/downloadsV2/cleanup?linkIds&packageIds&action&mode&selectionType
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
forceDownloadParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/downloadsV2/forceDownload?linkIds&packageIds
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
getDownloadUrlsParameter: 3
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
 3 - urlDisplayType (UrlDisplayTypeStorable[])
Call/downloadsV2/getDownloadUrls?linkIds&packageIds&urlDisplayType
Return typeMap<String, List<Long>>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
getStopMarkParameter: 0
Call/downloadsV2/getStopMark
Return typelong
getStopMarkedLinkParameter: 0
Call/downloadsV2/getStopMarkedLink
Return typeDownloadLink
getStructureChangeCounterParameter: 1
Parameter1 - oldCounterValue (long)
Call/downloadsV2/getStructureChangeCounter?oldCounterValue
Return typelong
moveLinksParameter: 3
Parameter1 - linkIds (long[])
 2 - afterLinkID (long)
 3 - destPackageID (long)
Call/downloadsV2/moveLinks?linkIds&afterLinkID&destPackageID
movePackagesParameter: 2
Parameter1 - packageIds (long[])
 2 - afterDestPackageId (long)
Call/downloadsV2/movePackages?packageIds&afterDestPackageId
movetoNewPackageParameter: 4
Parameter1 - linkIds (long[])
 2 - pkgIds (long[])
 3 - newPkgName (String)
 4 - downloadPath (String)
Call/downloadsV2/movetoNewPackage?linkIds&pkgIds&newPkgName&downloadPath
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
packageCountParameter: 0
Call/downloadsV2/packageCount
Return typeint
queryLinksParameter: 1
Parameter1 - queryParams (LinkQuery)
Call/downloadsV2/queryLinks?queryParams
Return typeList<DownloadLink>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
queryPackagesParameter: 1
Parameter1 - queryParams (PackageQuery)
Call/downloadsV2/queryPackages?queryParams
Return typeList<FilePackage>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
removeLinksParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/downloadsV2/removeLinks?linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
removeStopMarkParameter: 0
Call/downloadsV2/removeStopMark
renameLinkParameter: 2
Parameter1 - linkId (Long)
 2 - newName (String)
Call/downloadsV2/renameLink?linkId&newName
renamePackageParameter: 2
Parameter1 - packageId (Long)
 2 - newName (String)
Call/downloadsV2/renamePackage?packageId&newName
resetLinksParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/downloadsV2/resetLinks?linkIds&packageIds
resumeLinksParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/downloadsV2/resumeLinks?linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setDownloadDirectoryParameter: 2
Parameter1 - directory (String)
 2 - packageIds (long[])
Call/downloadsV2/setDownloadDirectory?directory&packageIds
setDownloadPasswordParameter: 3
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
 3 - pass (String)
Call/downloadsV2/setDownloadPassword?linkIds&packageIds&pass
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setEnabledParameter: 3
Parameter1 - enabled (boolean)
 2 - linkIds (long[])
 3 - packageIds (long[])
Call/downloadsV2/setEnabled?enabled&linkIds&packageIds
setPriorityParameter: 3
Parameter1 - priority (Priority)
 2 - linkIds (long[])
 3 - packageIds (long[])
Call/downloadsV2/setPriority?priority&linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setStopMarkParameter: 2
Parameter1 - linkId (long)
 2 - packageId (long)
Call/downloadsV2/setStopMark?linkId&packageId
splitPackageByHosterParameter: 2
Parameter1 - linkIds (long[])
 2 - pkgIds (long[])
Call/downloadsV2/splitPackageByHoster?linkIds&pkgIds
startOnlineStatusCheckParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/downloadsV2/startOnlineStatusCheck?linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
unskipParameter: 3
Parameter1 - packageIds (long[])
 2 - linkIds (long[])
 3 - filterByReason (Reason)
Call/downloadsV2/unskip?packageIds&linkIds&filterByReason
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
Namespace /events
addsubscriptionParameter: 3
Parameter1 - subscriptionid (long)
 2 - subscriptions (String[])
 3 - exclusions (String[])
Call/events/addsubscription?subscriptionid&subscriptions&exclusions
Return typeSubscriptionResponse
changesubscriptiontimeoutsParameter: 3
Parameter1 - subscriptionid (long)
 2 - polltimeout (long)
 3 - maxkeepalive (long)
Call/events/changesubscriptiontimeouts?subscriptionid&polltimeout&maxkeepalive
Return typeSubscriptionResponse
getsubscriptionParameter: 1
Parameter1 - subscriptionid (long)
Call/events/getsubscription?subscriptionid
Return typeSubscriptionResponse
getsubscriptionstatusParameter: 1
Parameter1 - subscriptionid (long)
Call/events/getsubscriptionstatus?subscriptionid
Return typeSubscriptionStatusResponse
listenParameter: 1
Parameter1 - subscriptionid (long)
Call/events/listen?subscriptionid
Possible Error(s)ResponseCode 404 (Not Found); Type:FILE_NOT_FOUND
 ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
listpublisherParameter: 0
Call/events/listpublisher
Return typeList<PublisherResponse>
removesubscriptionParameter: 3
Parameter1 - subscriptionid (long)
 2 - subscriptions (String[])
 3 - exclusions (String[])
Call/events/removesubscription?subscriptionid&subscriptions&exclusions
Return typeSubscriptionResponse
setsubscriptionParameter: 3
Parameter1 - subscriptionid (long)
 2 - subscriptions (String[])
 3 - exclusions (String[])
Call/events/setsubscription?subscriptionid&subscriptions&exclusions
Return typeSubscriptionResponse
subscribeParameter: 2
Parameter1 - subscriptions (String[])
 2 - exclusions (String[])
Call/events/subscribe?subscriptions&exclusions
Return typeSubscriptionResponse
unsubscribeParameter: 1
Parameter1 - subscriptionid (long)
Call/events/unsubscribe?subscriptionid
Return typeSubscriptionResponse
Namespace /extensions
installParameter: 1
Parameter1 - id (String)
Call/extensions/install?id
Return typeboolean
isEnabledParameter: 1
Parameter1 - classname (String)
Call/extensions/isEnabled?classname
Return typeboolean
isInstalledParameter: 1
Parameter1 - id (String)
Call/extensions/isInstalled?id
Return typeboolean
listParameter: 1
Parameter1 - query (ExtensionQuery)
Call/extensions/list?query
Return typeList<Extension>
setEnabledParameter: 2
Parameter1 - classname (String)
 2 - b (boolean)
Call/extensions/setEnabled?classname&b
Return typeboolean
Namespace /extraction
addArchivePasswordParameter: 1
Parameter1 - password (String)
Call/extraction/addArchivePassword?password
cancelExtractionParameter: 1
Parameter1 - controllerID (long)
Call/extraction/cancelExtraction?controllerID
Return typeboolean
getArchiveInfoParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/extraction/getArchiveInfo?linkIds&packageIds
Return typeList<ArchiveStatus>
getArchiveSettingsParameter: 1
Parameter1 - archiveIds (String[])
Call/extraction/getArchiveSettings?archiveIds
Return typeList<ArchiveSettings>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
getQueueParameter: 0
Call/extraction/getQueue
Return typeList<ArchiveStatus>
setArchiveSettingsParameter: 2
Parameter1 - archiveId (String)
 2 - archiveSettings (ArchiveSettings)
Call/extraction/setArchiveSettings?archiveId&archiveSettings
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
startExtractionNowParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/extraction/startExtractionNow?linkIds&packageIds
Return typeMap<String, boolean|null>
Namespace /flash
addParameter: 3
Parameter1 - password (String)
 2 - source (String)
 3 - url (String)
Call/flash/add?password&source&url
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
addParameter: 4
Parameter1 - String
 2 - String
 3 - String
 4 - String
Call/flash/add?String&String&String&String
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
addParameter: 0
Call/flash/add
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
addcnlParameter: 1
Parameter1 - cnl (CnlQuery)
Call/flash/addcnl?cnl
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
addcryptedParameter: 0
Call/flash/addcrypted
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
addcrypted2Parameter: 0
Call/flash/addcrypted2
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
addcrypted2RemoteParameter: 3
Parameter1 - crypted (String)
 2 - jk (String)
 3 - k (String)
Call/flash/addcrypted2Remote?crypted&jk&k
Parameter: 0
Call/flash/
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
Namespace /jd
doSomethingCoolParameter: 0
Call/jd/doSomethingCool
getCoreRevisionParameter: 0
Call/jd/getCoreRevision
Return typeInteger
refreshPluginsParameter: 0
Call/jd/refreshPlugins
Return typeboolean
sumParameter: 2
Parameter1 - a (int)
 2 - b (int)
Call/jd/sum?a&b
Return typeint
uptimeParameter: 0
Call/jd/uptime
Return typelong
versionParameter: 0
Call/jd/version
Return typelong
Namespace /linkcollector
addContainerParameter: 2
Parameter1 - type (String)
 2 - content (String)
Call/linkcollector/addContainer?type&content
addLinksParameter: 4
Parameter1 - link (String)
 2 - packageName (String)
 3 - archivePassword (String)
 4 - linkPassword (String)
Call/linkcollector/addLinks?link&packageName&archivePassword&linkPassword
Return typeboolean|null
addLinksParameter: 5
Parameter1 - links (String)
 2 - packageName (String)
 3 - extractPassword (String)
 4 - downloadPassword (String)
 5 - destinationFolder (String)
Call/linkcollector/addLinks?links&packageName&extractPassword&downloadPassword&destinationFolder
Return typeboolean|null
addLinksAndStartDownloadParameter: 4
Parameter1 - links (String)
 2 - packageName (String)
 3 - extractPassword (String)
 4 - downloadPassword (String)
Call/linkcollector/addLinksAndStartDownload?links&packageName&extractPassword&downloadPassword
Return typeboolean|null
disableLinksParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/linkcollector/disableLinks?linkIds&packageIds
Return typeboolean
disableLinksParameter: 1
Parameter1 - linkIds (List)
Call/linkcollector/disableLinks?linkIds
Return typeboolean
enableLinksParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/linkcollector/enableLinks?linkIds&packageIds
Return typeboolean
enableLinksParameter: 1
Parameter1 - linkIds (List)
Call/linkcollector/enableLinks?linkIds
Return typeboolean
getChildrenChangedParameter: 1
Parameter1 - structureWatermark (Long)
Call/linkcollector/getChildrenChanged?structureWatermark
Return typeLong
getDownloadFolderHistorySelectionBaseParameter: 0
Call/linkcollector/getDownloadFolderHistorySelectionBase
Return typeList<String>
moveLinksParameter: 1
Parameter1 - query (APIQuery)
Call/linkcollector/moveLinks?query
Return typeboolean
movePackagesParameter: 1
Parameter1 - query (APIQuery)
Call/linkcollector/movePackages?query
Return typeboolean
packageCountParameter: 0
Call/linkcollector/packageCount
Return typeint
queryLinksParameter: 1
Parameter1 - queryParams (APIQuery)
Call/linkcollector/queryLinks?queryParams
Return typeList<CrawledLink>
queryPackagesParameter: 1
Parameter1 - queryParams (APIQuery)
Call/linkcollector/queryPackages?queryParams
Return typeList<CrawledPackage>
removeLinksParameter: 2
Parameter1 - packageIds (List)
 2 - linkIds (List)
Call/linkcollector/removeLinks?packageIds&linkIds
Return typeboolean|null
removeLinksParameter: 1
Parameter1 - linkIds (List)
Call/linkcollector/removeLinks?linkIds
Return typeboolean|null
renameLinkParameter: 3
Parameter1 - packageId (Long)
 2 - linkId (Long)
 3 - newName (String)
Call/linkcollector/renameLink?packageId&linkId&newName
Return typeboolean
renamePackageParameter: 2
Parameter1 - packageId (Long)
 2 - newName (String)
Call/linkcollector/renamePackage?packageId&newName
Return typeboolean
startDownloadsParameter: 1
Parameter1 - linkIds (List)
Call/linkcollector/startDownloads?linkIds
Return typeboolean|null
startDownloadsParameter: 2
Parameter1 - linkIds (List)
 2 - packageIds (List)
Call/linkcollector/startDownloads?linkIds&packageIds
Return typeboolean|null
Namespace /linkcrawler
isCrawlingParameter: 0
Call/linkcrawler/isCrawling
Return typeboolean
Namespace /linkgrabberv2
abortParameter: 0
Call/linkgrabberv2/abort
Return typeboolean
abortParameter: 1
Parameter1 - jobId (long)
Call/linkgrabberv2/abort?jobId
Return typeboolean
addContainerParameter: 2
Parameter1 - type (String)
 2 - content (String)
Call/linkgrabberv2/addContainer?type&content
Return typeLinkCollectingJob
addLinksParameter: 1
Parameter1 - query (AddLinksQuery)
Call/linkgrabberv2/addLinks?query
Return typeLinkCollectingJob
addVariantCopyParameter: 4
Parameter1 - linkid (long)
 2 - destinationAfterLinkID (long)
 3 - destinationPackageID (long)
 4 - variantID (String)
Call/linkgrabberv2/addVariantCopy?linkid&destinationAfterLinkID&destinationPackageID&variantID
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
cleanupParameter: 5
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
 3 - action (Action)
 4 - mode (Mode)
 5 - selectionType (SelectionType)
Call/linkgrabberv2/cleanup?linkIds&packageIds&action&mode&selectionType
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
clearListParameter: 0
Call/linkgrabberv2/clearList
Return typeboolean
getChildrenChangedParameter: 1
Parameter1 - structureWatermark (long)
Call/linkgrabberv2/getChildrenChanged?structureWatermark
Return typelong
getDownloadFolderHistorySelectionBaseParameter: 0
Call/linkgrabberv2/getDownloadFolderHistorySelectionBase
Return typeList<String>
getDownloadUrlsParameter: 3
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
 3 - urlDisplayTypes (UrlDisplayTypeStorable[])
Call/linkgrabberv2/getDownloadUrls?linkIds&packageIds&urlDisplayTypes
Return typeMap<String, List<Long>>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
getPackageCountParameter: 0
Call/linkgrabberv2/getPackageCount
Return typeint
getVariantsParameter: 1
Parameter1 - linkid (long)
Call/linkgrabberv2/getVariants?linkid
Return typeList<LinkVariant>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
isCollectingParameter: 0
Call/linkgrabberv2/isCollecting
Return typeboolean
moveLinksParameter: 3
Parameter1 - linkIds (long[])
 2 - afterLinkID (long)
 3 - destPackageID (long)
Call/linkgrabberv2/moveLinks?linkIds&afterLinkID&destPackageID
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
movePackagesParameter: 2
Parameter1 - packageIds (long[])
 2 - afterDestPackageId (long)
Call/linkgrabberv2/movePackages?packageIds&afterDestPackageId
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
moveToDownloadlistParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/linkgrabberv2/moveToDownloadlist?linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
movetoNewPackageParameter: 4
Parameter1 - linkIds (long[])
 2 - pkgIds (long[])
 3 - newPkgName (String)
 4 - downloadPath (String)
Call/linkgrabberv2/movetoNewPackage?linkIds&pkgIds&newPkgName&downloadPath
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
queryLinkCrawlerJobsParameter: 1
Parameter1 - query (LinkCrawlerJobsQuery)
Call/linkgrabberv2/queryLinkCrawlerJobs?query
Return typeList<JobLinkCrawler>
queryLinksParameter: 1
Parameter1 - queryParams (CrawledLinkQuery)
Call/linkgrabberv2/queryLinks?queryParams
Return typeList<CrawledLink>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
queryPackagesParameter: 1
Parameter1 - queryParams (CrawledPackageQuery)
Call/linkgrabberv2/queryPackages?queryParams
Return typeList<CrawledPackage>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
removeLinksParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/linkgrabberv2/removeLinks?linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
renameLinkParameter: 2
Parameter1 - linkId (long)
 2 - newName (String)
Call/linkgrabberv2/renameLink?linkId&newName
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
renamePackageParameter: 2
Parameter1 - packageId (long)
 2 - newName (String)
Call/linkgrabberv2/renamePackage?packageId&newName
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setDownloadDirectoryParameter: 2
Parameter1 - directory (String)
 2 - packageIds (long[])
Call/linkgrabberv2/setDownloadDirectory?directory&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setDownloadPasswordParameter: 3
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
 3 - pass (String)
Call/linkgrabberv2/setDownloadPassword?linkIds&packageIds&pass
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setEnabledParameter: 3
Parameter1 - enabled (boolean)
 2 - linkIds (long[])
 3 - packageIds (long[])
Call/linkgrabberv2/setEnabled?enabled&linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setPriorityParameter: 3
Parameter1 - priority (Priority)
 2 - linkIds (long[])
 3 - packageIds (long[])
Call/linkgrabberv2/setPriority?priority&linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
setVariantParameter: 2
Parameter1 - linkid (long)
 2 - variantID (String)
Call/linkgrabberv2/setVariant?linkid&variantID
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
splitPackageByHosterParameter: 2
Parameter1 - linkIds (long[])
 2 - pkgIds (long[])
Call/linkgrabberv2/splitPackageByHoster?linkIds&pkgIds
startOnlineStatusCheckParameter: 2
Parameter1 - linkIds (long[])
 2 - packageIds (long[])
Call/linkgrabberv2/startOnlineStatusCheck?linkIds&packageIds
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
Namespace /log
getAvailableLogsParameter: 0
Call/log/getAvailableLogs
Return typeList<LogFolder>
sendLogFileParameter: 1
Parameter1 - logFolders (LogFolderStorable[])
Call/log/sendLogFile?logFolders
Return typeString
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
Namespace /plugins
getParameter: 3
Parameter1 - interfaceName (String)
 2 - displayName (String)
 3 - key (String)
Call/plugins/get?interfaceName&displayName&key
Return typeObject
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
getAllPluginRegexParameter: 0
Call/plugins/getAllPluginRegex
Return typeMap<String, List<String>>
getPluginRegexParameter: 1
Parameter1 - URL (String)
Call/plugins/getPluginRegex?URL
Return typeList<String>
listParameter: 1
Parameter1 - query (PluginsQuery)
Call/plugins/list?query
Return typeList<Plugin>
queryParameter: 1
Parameter1 - query (AdvancedConfigQuery)
Call/plugins/query?query
Return typeList<PluginConfigEntry>
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
resetParameter: 3
Parameter1 - interfaceName (String)
 2 - displayName (String)
 3 - key (String)
Call/plugins/reset?interfaceName&displayName&key
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
 ResponseCode 400 (Bad Request); Type:INVALID_VALUE
setParameter: 4
Parameter1 - interfaceName (String)
 2 - displayName (String)
 3 - key (String)
 4 - newValue (Object)
Call/plugins/set?interfaceName&displayName&key&newValue
Return typeboolean
Possible Error(s)ResponseCode 400 (Bad Request); Type:BAD_PARAMETERS; Description: Bad Parameter
 ResponseCode 400 (Bad Request); Type:INVALID_VALUE
Namespace /polling
pollParameter: 1
Parameter1 - queryParams (APIQuery)
Call/polling/poll?queryParams
Return typeList<PollingResult>
Namespace /reconnect
doReconnectParameter: 0
Call/reconnect/doReconnect
Namespace /session
disconnectParameter: 0
Descriptioninvalides the current token
Call/session/disconnect
Return typeboolean
handshakeParameter: 2
Parameter1 - user (String)
 2 - password (String)
Descriptionreturns an un/authenticated token for given username and password or "error" in case login failed
Call/session/handshake?user&password
Return typeString
Possible Error(s)ResponseCode 403 (Forbidden); Type:AUTH_FAILED
Namespace /system
exitJDParameter: 0
Call/system/exitJD
getStorageInfosParameter: 1
Parameter1 - path (String)
Call/system/getStorageInfos?path
Return typeList<StorageInformation>
getSystemInfosParameter: 0
Call/system/getSystemInfos
Return typeSystemInformation
hibernateOSParameter: 0
Call/system/hibernateOS
restartJDParameter: 0
Call/system/restartJD
shutdownOSParameter: 1
Parameter1 - force (boolean)
Call/system/shutdownOS?force
standbyOSParameter: 0
Call/system/standbyOS
Namespace /toolbar
addLinksFromDOMParameter: 0
Call/toolbar/addLinksFromDOM
Return typeObject
checkLinksFromDOMParameter: 0
Call/toolbar/checkLinksFromDOM
Return typeObject
getStatusParameter: 0
Call/toolbar/getStatus
Return typeObject
isAvailableParameter: 0
Call/toolbar/isAvailable
Return typeboolean
pollCheckedLinksFromDOMParameter: 1
Parameter1 - checkID (String)
Call/toolbar/pollCheckedLinksFromDOM?checkID
Return typeLinkCheckResult
specialURLHandlingParameter: 1
Parameter1 - url (String)
Call/toolbar/specialURLHandling?url
Return typeString
startDownloadsParameter: 0
Call/toolbar/startDownloads
Return typeboolean
stopDownloadsParameter: 0
Call/toolbar/stopDownloads
Return typeboolean
toggleAutomaticReconnectParameter: 0
Call/toolbar/toggleAutomaticReconnect
Return typeboolean
toggleClipboardMonitoringParameter: 0
Call/toolbar/toggleClipboardMonitoring
Return typeboolean
toggleDownloadSpeedLimitParameter: 0
Call/toolbar/toggleDownloadSpeedLimit
Return typeboolean
togglePauseDownloadsParameter: 0
Call/toolbar/togglePauseDownloads
Return typeboolean
togglePremiumParameter: 0
Call/toolbar/togglePremium
Return typeboolean
toggleStopAfterCurrentDownloadParameter: 0
Call/toolbar/toggleStopAfterCurrentDownload
Return typeboolean
triggerUpdateParameter: 0
Call/toolbar/triggerUpdate
Return typeboolean
Namespace /ui
getMenuParameter: 1
Parameter1 - context (Context)
DescriptionGet the custom menu structure for the desired context
Call/ui/getMenu?context
Return typeMyJDMenuItem
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
 ResponseCode 404 (Not Found); Type:Not Found
invokeActionParameter: 4
Parameter1 - context (Context)
 2 - id (String)
 3 - linkIds (long[])
 4 - packageIds (long[])
DescriptionInvoke a menu action on our selection and get the results.
Call/ui/invokeAction?context&id&linkIds&packageIds
Return typeObject
Possible Error(s)ResponseCode 500 (Internal Server Error); Type:INTERNAL_SERVER_ERROR
 ResponseCode 404 (Not Found); Type:Not Found
Namespace /update
isUpdateAvailableParameter: 0
Call/update/isUpdateAvailable
Return typeboolean
restartAndUpdateParameter: 0
Call/update/restartAndUpdate
runUpdateCheckParameter: 0
Call/update/runUpdateCheck
Enums & Constants
AbstractType
BOOLEAN
INT
LONG
STRING
OBJECT
OBJECT_LIST
STRING_LIST
ENUM
BYTE
CHAR
DOUBLE
FLOAT
SHORT
BOOLEAN_LIST
BYTE_LIST
SHORT_LIST
LONG_LIST
INT_LIST
FLOAT_LIST
ENUM_LIST
DOUBLE_LIST
CHAR_LIST
UNKNOWN
HEX_COLOR
HEX_COLOR_LIST
ACTION
Action
DELETE_ALL
DELETE_DISABLED
DELETE_FAILED
DELETE_FINISHED
DELETE_OFFLINE
DELETE_DUPE
DELETE_MODE
ArchiveFileStatus
File is available for extraction
COMPLETE
File exists, but is incomplete
INCOMPLETE
File does not exist
MISSING
AvailableLinkState
ONLINE
OFFLINE
UNKNOWN
TEMP_UNKNOWN
Context
Linkgrabber Rightclick Context
LGC
Downloadlist Rightclick Context
DLC
ControllerStatus
Extraction is currently running
RUNNING
Archive is queued for extraction and will run as soon as possible
QUEUED
No controller assigned
NA
Mode
REMOVE_LINKS_AND_DELETE_FILES
REMOVE_LINKS_AND_RECYCLE_FILES
REMOVE_LINKS_ONLY
Priority
HIGHEST
HIGHER
HIGH
DEFAULT
LOW
LOWER
LOWEST
Reason
CONNECTION_UNAVAILABLE
TOO_MANY_RETRIES
CAPTCHA
MANUAL
DISK_FULL
NO_ACCOUNT
INVALID_DESTINATION
FILE_EXISTS
UPDATE_RESTART_REQUIRED
FFMPEG_MISSING
FFPROBE_MISSING
STATUS
NA
PENDING
FINISHED
SelectionType
SELECTED
UNSELECTED
ALL
NONE
SkipRequest
SINGLE
BLOCK_HOSTER
BLOCK_ALL_CAPTCHAS
BLOCK_PACKAGE
REFRESH
STOP_CURRENT_ACTION
TIMEOUT
Type
CONTAINER
ACTION
LINK
Type
FTP
HTTP
Structures & Objects
APIQuery

          myAPIQuery = 
                  {
                    "empty"      = (boolean),
                    "forNullKey" = (V),
                    "maxResults" = (Integer),
                    "startAt"    = (Integer)
                  }
Account

          myAccount = 
                  {
                    "enabled"     = (boolean),
                    "errorString" = (String),
                    "errorType"   = (String),
                    "hostname"    = (String),
                    "trafficLeft" = (Long),
                    "trafficMax"  = (Long),
                    "username"    = (String),
                    "uuid"        = (Long),
                    "valid"       = (boolean),
                    "validUntil"  = (Long)
                  }
Account

          myAccount = 
                  {
                    "hostname" = (String),
                    "infoMap"  = (JsonMap),
                    "uuid"     = (long)
                  }
AccountQuery

          myAccountQuery = 
                  {
                    "enabled"     = (boolean),
                    "error"       = (boolean),
                    "maxResults"  = (int),
                    "startAt"     = (int),
                    "trafficLeft" = (boolean),
                    "trafficMax"  = (boolean),
                    "userName"    = (boolean),
                    "uuidlist"    = (UnorderedList<Long>),
                    "valid"       = (boolean),
                    "validUntil"  = (boolean)
                  }
AddLinksQuery

          myAddLinksQuery = 
                  {
                    "assignJobID"              = (boolean|null),
                    "autoExtract"              = (boolean|null),
                    "autostart"                = (boolean|null),
                    "dataURLs"                 = (String[]),
                    "deepDecrypt"              = (boolean|null),
                    "destinationFolder"        = (String),
                    "downloadPassword"         = (String),
                    "extractPassword"          = (String),
                    "links"                    = (String),
                    "overwritePackagizerRules" = (boolean|null),
                    "packageName"              = (String),
                    "priority"                 = (Priority),
                    "sourceUrl"                = (String)
                  }
AdvancedConfigAPIEntry

          myAdvancedConfigAPIEntry = 
                  {
                    "abstractType"  = (AbstractType),
                    "defaultValue"  = (Object),
                    "docs"          = (String),
                    "enumLabel"     = (String),
                    "enumOptions"   = (String[][]),
                    "interfaceName" = (String),
                    "key"           = (String),
                    "storage"       = (String),
                    "type"          = (String),
                    "value"         = (Object)
                  }
AdvancedConfigQuery

          myAdvancedConfigQuery = 
                  {
                    "configInterface"   = (String),
                    "defaultValues"     = (boolean),
                    "description"       = (boolean),
                    "enumInfo"          = (boolean),
                    "includeExtensions" = (boolean),
                    "pattern"           = (String),
                    "values"            = (boolean)
                  }
ArchiveSettings


    /**
     * Leave Boolean values empty or set them to null if you want JD to use the default value
     */
          myArchiveSettings = 
                  {
                    "archiveId"                          = (String),
                    "autoExtract"                        = (boolean|null),
                    "extractPath"                        = (String),
                    "finalPassword"                      = (String),
                    "passwords"                          = (List<String>),
                    "removeDownloadLinksAfterExtraction" = (boolean|null),
                    "removeFilesAfterExtraction"         = (boolean|null)
                  }
ArchiveStatus

          myArchiveStatus = 
                  {
    /**
     * ID to adress the archive. Used for example for extraction/getArchiveSettings?[,,...]
     */

                    "archiveId"        = (String),
                    "archiveName"      = (String),
    /**
     * -1 or the controller ID if any controller is active. Used in cancelExtraction? 
     */

                    "controllerId"     = (long),
    /**
     * The status of the controller
     */

                    "controllerStatus" = (ControllerStatus),
    /**
     * Map Keys: Filename of the Part-File. Values: ArchiveFileStatus
     * Example: 
     * {
     * "archive.part1.rar":"COMPLETE",
     * "archive.part2.rar":"MISSING"
     * }
     */

                    "states"           = (Map<String, ArchiveFileStatus>),
    /**
     * Type of the archive. e.g. "GZIP_SINGLE", "RAR_MULTI","RAR_SINGLE",.... 
     */

                    "type"             = (String)
                  }
BasicAuthentication

          myBasicAuthentication = 
                  {
                    "created"       = (long),
                    "enabled"       = (boolean),
                    "hostmask"      = (String),
                    "id"            = (long),
                    "lastValidated" = (long),
                    "password"      = (String),
                    "type"          = (Type),
                    "username"      = (String)
                  }
CaptchaJob

          myCaptchaJob = 
                  {
                    "captchaCategory" = (String),
                    "created"         = (long),
                    "explain"         = (String),
                    "hoster"          = (String),
                    "id"              = (long),
                    "link"            = (long),
                    "timeout"         = (int),
                    "type"            = (String)
                  }
CnlQuery

          myCnlQuery = 
                  {
                    "comment"     = (String),
                    "crypted"     = (String),
                    "dir"         = (String),
                    "jk"          = (String),
                    "key"         = (String),
                    "orgReferrer" = (String),
                    "orgSource"   = (String),
                    "packageName" = (String),
                    "passwords"   = (List<String>),
                    "permission"  = (boolean),
                    "referrer"    = (String),
                    "source"      = (String),
                    "urls"        = (String)
                  }
CrawledLink

          myCrawledLink = 
                  {
                    "availability"     = (AvailableLinkState),
                    "bytesTotal"       = (long),
                    "comment"          = (String),
                    "downloadPassword" = (String),
                    "enabled"          = (boolean),
                    "host"             = (String),
                    "name"             = (String),
                    "packageUUID"      = (long),
                    "priority"         = (Priority),
                    "url"              = (String),
                    "uuid"             = (long),
                    "variant"          = (LinkVariant),
                    "variants"         = (boolean)
                  }
CrawledLink

          myCrawledLink = 
                  {
                    "infoMap"  = (JsonMap),
                    "name"     = (String),
                    "uniqueID" = (Long),
                    "uuid"     = (Long)
                  }
CrawledLinkQuery

          myCrawledLinkQuery = 
                  {
                    "availability" = (boolean),
                    "bytesTotal"   = (boolean),
                    "comment"      = (boolean),
                    "enabled"      = (boolean),
                    "host"         = (boolean),
                    "jobUUIDs"     = (long[]),
                    "maxResults"   = (int),
                    "packageUUIDs" = (long[]),
                    "password"     = (boolean),
                    "priority"     = (boolean),
                    "startAt"      = (int),
                    "status"       = (boolean),
                    "url"          = (boolean),
                    "variantID"    = (boolean),
                    "variantIcon"  = (boolean),
                    "variantName"  = (boolean),
                    "variants"     = (boolean)
                  }
CrawledPackage

          myCrawledPackage = 
                  {
                    "infoMap" = (JsonMap),
                    "name"    = (String),
                    "uuid"    = (long)
                  }
CrawledPackage

          myCrawledPackage = 
                  {
                    "bytesTotal"       = (long),
                    "childCount"       = (int),
                    "comment"          = (String),
                    "downloadPassword" = (String),
                    "enabled"          = (boolean),
                    "hosts"            = (String[]),
                    "name"             = (String),
                    "offlineCount"     = (int),
                    "onlineCount"      = (int),
                    "priority"         = (Priority),
                    "saveTo"           = (String),
                    "tempUnknownCount" = (int),
                    "unknownCount"     = (int),
                    "uuid"             = (long)
                  }
CrawledPackageQuery

          myCrawledPackageQuery = 
                  {
                    "availableOfflineCount"     = (boolean),
                    "availableOnlineCount"      = (boolean),
                    "availableTempUnknownCount" = (boolean),
                    "availableUnknownCount"     = (boolean),
                    "bytesTotal"                = (boolean),
                    "childCount"                = (boolean),
                    "comment"                   = (boolean),
                    "enabled"                   = (boolean),
                    "hosts"                     = (boolean),
                    "maxResults"                = (int),
                    "packageUUIDs"              = (long[]),
                    "priority"                  = (boolean),
                    "saveTo"                    = (boolean),
                    "startAt"                   = (int),
                    "status"                    = (boolean)
                  }
DialogInfo

          myDialogInfo = 
                  {
                    "properties" = (Map<String, String>),
                    "type"       = (String)
                  }
DialogTypeInfo

          myDialogTypeInfo = 
                  {
                    "in"  = (Map<String, String>),
                    "out" = (Map<String, String>)
                  }
DownloadLink

          myDownloadLink = 
                  {
                    "infoMap" = (JsonMap),
                    "name"    = (String),
                    "uuid"    = (long)
                  }
DownloadLink

          myDownloadLink = 
                  {
                    "addedDate"        = (long),
                    "bytesLoaded"      = (long),
                    "bytesTotal"       = (long),
                    "comment"          = (String),
                    "downloadPassword" = (String),
                    "enabled"          = (boolean),
                    "eta"              = (long),
                    "extractionStatus" = (String),
                    "finished"         = (boolean),
                    "finishedDate"     = (long),
                    "host"             = (String),
                    "name"             = (String),
                    "packageUUID"      = (long),
                    "priority"         = (Priority),
                    "running"          = (boolean),
                    "skipped"          = (boolean),
                    "speed"            = (long),
                    "status"           = (String),
                    "statusIconKey"    = (String),
                    "url"              = (String),
                    "uuid"             = (long)
                  }
DownloadListDiff

          myDownloadListDiff = 
                  {
                  }
EnumOption

          myEnumOption = 
                  {
                    "label" = (String),
                    "name"  = (String)
                  }
Extension

          myExtension = 
                  {
                    "configInterface" = (String),
                    "description"     = (String),
                    "enabled"         = (boolean),
                    "iconKey"         = (String),
                    "id"              = (String),
                    "installed"       = (boolean),
                    "name"            = (String)
                  }
ExtensionQuery

          myExtensionQuery = 
                  {
                    "configInterface" = (boolean),
                    "description"     = (boolean),
                    "enabled"         = (boolean),
                    "iconKey"         = (boolean),
                    "installed"       = (boolean),
                    "name"            = (boolean),
                    "pattern"         = (String)
                  }
FilePackage

          myFilePackage = 
                  {
                    "infoMap" = (JsonMap),
                    "name"    = (String),
                    "uuid"    = (long)
                  }
FilePackage

          myFilePackage = 
                  {
                    "activeTask"       = (String),
                    "bytesLoaded"      = (long),
                    "bytesTotal"       = (long),
                    "childCount"       = (int),
                    "comment"          = (String),
                    "downloadPassword" = (String),
                    "enabled"          = (boolean),
                    "eta"              = (long),
                    "finished"         = (boolean),
                    "hosts"            = (String[]),
                    "name"             = (String),
                    "priority"         = (Priority),
                    "running"          = (boolean),
                    "saveTo"           = (String),
                    "speed"            = (long),
                    "status"           = (String),
                    "statusIconKey"    = (String),
                    "uuid"             = (long)
                  }
IconDescriptor

          myIconDescriptor = 
                  {
                    "cls"  = (String),
                    "key"  = (String),
                    "prps" = (Map<String, Object>),
                    "rsc"  = (List<IconDescriptor>)
                  }
JobLinkCrawler

          myJobLinkCrawler = 
                  {
                    "broken"    = (int),
                    "checking"  = (boolean),
                    "crawled"   = (int),
                    "crawlerId" = (long),
                    "crawling"  = (boolean),
                    "filtered"  = (int),
                    "jobId"     = (long),
                    "unhandled" = (int)
                  }
LinkCheckResult

          myLinkCheckResult = 
                  {
                    "links"  = (List<LinkStatus>),
                    "status" = (STATUS)
                  }
LinkCollectingJob

          myLinkCollectingJob = 
                  {
                    "id" = (long)
                  }
LinkCrawlerJobsQuery

          myLinkCrawlerJobsQuery = 
                  {
                    "collectorInfo" = (boolean),
                    "jobIds"        = (long[])
                  }
LinkQuery

          myLinkQuery = 
                  {
                    "addedDate"        = (boolean),
                    "bytesLoaded"      = (boolean),
                    "bytesTotal"       = (boolean),
                    "comment"          = (boolean),
                    "enabled"          = (boolean),
                    "eta"              = (boolean),
                    "extractionStatus" = (boolean),
                    "finished"         = (boolean),
                    "finishedDate"     = (boolean),
                    "host"             = (boolean),
                    "jobUUIDs"         = (long[]),
                    "maxResults"       = (int),
                    "packageUUIDs"     = (long[]),
                    "password"         = (boolean),
                    "priority"         = (boolean),
                    "running"          = (boolean),
                    "skipped"          = (boolean),
                    "speed"            = (boolean),
                    "startAt"          = (int),
                    "status"           = (boolean),
                    "url"              = (boolean)
                  }
LinkStatus

          myLinkStatus = 
                  {
                    "host"        = (String),
                    "linkCheckID" = (String),
                    "name"        = (String),
                    "size"        = (long),
                    "status"      = (AvailableLinkState),
                    "url"         = (String)
                  }
LinkVariant

          myLinkVariant = 
                  {
                    "iconKey" = (String),
                    "id"      = (String),
                    "name"    = (String)
                  }
LinkVariant

          myLinkVariant = 
                  {
                    "iconKey" = (String),
                    "id"      = (String),
                    "name"    = (String)
                  }
LogFolder

          myLogFolder = 
                  {
                    "created"      = (long),
                    "current"      = (boolean),
                    "lastModified" = (long)
                  }
MenuStructure

          myMenuStructure = 
                  {
                    "children" = (List<MenuStructure>),
                    "icon"     = (String),
                    "id"       = (String),
                    "name"     = (String),
                    "type"     = (Type)
                  }
MyJDMenuItem

          myMyJDMenuItem = 
                  {
                    "children" = (List<MenuStructure>),
                    "icon"     = (String),
                    "id"       = (String),
                    "name"     = (String),
                    "type"     = (Type)
                  }
PackageQuery

          myPackageQuery = 
                  {
                    "bytesLoaded"  = (boolean),
                    "bytesTotal"   = (boolean),
                    "childCount"   = (boolean),
                    "comment"      = (boolean),
                    "enabled"      = (boolean),
                    "eta"          = (boolean),
                    "finished"     = (boolean),
                    "hosts"        = (boolean),
                    "maxResults"   = (int),
                    "packageUUIDs" = (long[]),
                    "priority"     = (boolean),
                    "running"      = (boolean),
                    "saveTo"       = (boolean),
                    "speed"        = (boolean),
                    "startAt"      = (int),
                    "status"       = (boolean)
                  }
Plugin

          myPlugin = 
                  {
                    "abstractType"  = (AbstractType),
                    "className"     = (String),
                    "defaultValue"  = (Object),
                    "displayName"   = (String),
                    "docs"          = (String),
                    "enumLabel"     = (String),
                    "enumOptions"   = (String[][]),
                    "interfaceName" = (String),
                    "key"           = (String),
                    "pattern"       = (String),
                    "storage"       = (String),
                    "type"          = (String),
                    "value"         = (Object),
                    "version"       = (String)
                  }
PluginConfigEntry

          myPluginConfigEntry = 
                  {
                    "abstractType"  = (AbstractType),
                    "defaultValue"  = (Object),
                    "docs"          = (String),
                    "enumLabel"     = (String),
                    "enumOptions"   = (String[][]),
                    "interfaceName" = (String),
                    "key"           = (String),
                    "storage"       = (String),
                    "type"          = (String),
                    "value"         = (Object)
                  }
PluginsQuery

          myPluginsQuery = 
                  {
                    "pattern" = (boolean),
                    "version" = (boolean)
                  }
PollingResult

          myPollingResult = 
                  {
                    "eventData" = (JsonMap),
                    "eventName" = (String)
                  }
PublisherResponse

          myPublisherResponse = 
                  {
                    "eventids"  = (String[]),
                    "publisher" = (String)
                  }
SubscriptionResponse

          mySubscriptionResponse = 
                  {
                    "exclusions"     = (String[]),
                    "maxKeepalive"   = (long),
                    "maxPolltimeout" = (long),
                    "subscribed"     = (boolean),
                    "subscriptionid" = (long),
                    "subscriptions"  = (String[])
                  }
SubscriptionStatusResponse

          mySubscriptionStatusResponse = 
                  {
                    "queueSize"      = (int),
                    "subscribed"     = (boolean),
                    "subscriptionid" = (long)
                  }