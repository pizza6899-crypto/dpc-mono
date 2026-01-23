# DCS API

# DCS Seamless wallet API document


Version (^) Date Description
1.0 (^1 2022) - 06 - 30 DCS API document created
1.01 2022 - 07 - 17 Adjustment:
2.8 FreeSpin Campaign Player Setup
4.1 DCS API Response Code
4.5 Wager_type
1 .02 (^2022) - 08 - 08 Adjustment:
2.1 Login Game，brand_uid String(32) => String(20)

1. 10 2022 - 08 - 15 Add Special Remarks in:
    3.2 Wager
    3.3 CancelWager
    3.4 AppendWager
    3.5 EndWager
    3.6 FreeSpinResult
    Adjustment:
    4.1 DCS API Response Code

1.11 2022 - 08 - 30 Add Special Remarks in:
3.3 CancelWager Response code

1.12 2022 - 09 - 19 Add providers in 4 .6 Provider code
nlc – Nolimit City
png – Play’n Go
hs - Hacksaw

1 .13 2022 - 09 - 29 Adjustment:
3.Brand API endpoints implementation，Response code String(7) => Int

1.14 2022 - 10 - 13 Add VES、SSP in 4.2 Currency code List^
Add providers in 4.6 Provider code: aux - Avatarux

1.1 5 2022 - 10 - 31 Add 5042 to Special Remarks in 3.5 EndWager
Change “campaign” description in 4.5 wager_type

1.16 2022 - 11 - 09 Add cancelEndWager, promopayout in 4.5 Wager_type
Add wager_type property in 3.3 cancelWager,
Add bet_type property in 3.2 Wager


```
Add tip, game_result property in 2.3 Response
Add providers in 4.6 Provider code
evo – Evo Play
gam – Solid/Gamomat
ghg – Solid/Golden Hero
psh – Solid/Push
ezugi – Ezugi
swf – Solid/WinFast
ft –FunTa
Add 3.8 promoPayout Method
Adjustment: 2.3 Report Request restriction
```
1.17 2022 - 11 - 29 1. Delete 2.6 Get Jackpot Information Method
1.1 previous version function no. 2.7 function no. change to 2.
1.2 previous version function no. 2. 8 function no. change to 2. 7
1.3 previous version function no. 2. 9 function no. change to 2. 8

2. Add currency property in 3.3 cancelWager

1.2 2022 - 12 - 27 Brand API endpoints implementation: Adjust 3.2 Wager,
3.3CancelWager, 3.4 AppendWager, 3.5EndWager, 3.6FreeSpinResult,
adding “is_endround” property

1.21 2023 - 02 - 03 1. Adjust 8.3 PromoPayout Sign rule

2. Adjust 3.2 Wager Special Remarks

1.22 2023 - 04 - 30 4.1 DCS API Response Code add 5019, 5020
4.6 Provider Code Edit ft To funta
Adjustment: 2.1 Login game -> token description
Add game_result property in 3.5 Endwager request
Add Special remarks in 3.8 promoPayout
Adjustment: amount, balance Type Decimal(16,2) into Decimal(16,6)

1.23 2023 - 06 - 06 Adjustment:
2.4 Game Replay description
4.1 DCS API Response Code add 5021, 5023, 5024

1.24 2023 - 07 - 14 Adjustment: 4.1 DCS API Response Code 5009, 5013 description
Add providers in 4.6 Provider code
mj – 7Mojos
fm - Fantasma
ps – Peter & Sons


1.25 2023 - 10 - 16 Add providers in 4.6 Provider code
sb – Spribe
plb – Parlay bay
2.3 Report add “is_endround” parameter in response

1.26 2024 - 01 - 10 Remove currency: uBTC, UBC
Add provider in 4.6 Provider Code:
evl – Evolution
btg – Big Time Gaming
ne – NetEnt
rt – Red Tiger
dcace – DCACE
tg/tgo – Turbo Games
wz – Wazdan
Add content property in 2.5 Get Game List response
Add freespin_id, freespin_description in 3.6 FreeSpinResult request

1.27 2024 - 04 - 22 Add provider in 4.6 Provider Code:
tk – Thunderkick

1.30 2024 - 5 - 29 Add provider in 4.6 Provider Code:
lm – Lucky Monaco
yt - Yolted

1.3 1 2024 - 7 - 31 Add provider in 4.6 Provider Code:
sa – SA gaming
ss – Smartsoft
bg –Bgaming

1.32 2024 - 08 - 28 1. Add provider in 4.6 Provider Code:
nm – Novomatic
op – Octoplay
bp – BluePrint

2. 3.8 PromoPayout Special Remarks adjustment

1.33 2024 - 10 - 30 1. Add provider in 4.6 Provider Code:
hso - Hacksaw Gaming ROW
hsl - Hacksaw Gaming Latam

2. 4.1 DCS API Response Code add 5025
3. 4.6 Provider description revision: Wazdan => Voltent (Wazdan)


1.34 2025 - 2 - 25 1. Add provider in 3.6 Provider Code:
1.1 tq – Tequity
1.2 raw – RAW

2. Remove provider in 3.6 Provider Code :
2.1 ghg – Golden Hero

1.35 2025 - 03 - 18 The following method adds an attribute parameter transaction_time
VARCHAR( 20 ).
3.2 Wager
3.3 CancelWager
3.4 AppendWager
3.5 EndWager
3.6 FreeSpinResult
3.8 PromoPayout

1.36 2025 - 03 - 28 Adjust the following method attribute parameter transaction_time
description
3.2 Wager
3.3 CancelWager
3.4 AppendWager
3.5 EndWager
3.6 FreeSpinResult
3.8 PromoPayout

1.37 2025 - 04 - 24 1. Adjust the following methods regarding the description of Code 5043
3.2 Wager
3.3 CancelWager
3.4 AppendWager
3.5 EndWager
3.6 FreeSpinResult
3.8 PromoPayout

1.38 2025 - 07 - 21 1. Add request parameters, request restriction, response information,
and add start_time for the response in 2. 8 FreeSpin Campaign
Query

2. Add provider in 4 .6 Provider Code:
    bm – Booming Games

1.39 2025 - 08 - 12 1. 4.6 Provider description revision: Tequity => Originals (Tequity)

2. 4.2 Remove Currency Code List “TWD”


3. Add provider in 4 .6 Provider Code:
    ag – PlayACE
    pts – PlayTech Slot
    ptc – PlayTech Casino

1.40 2025 - 09 - 22 1. Add 2. 9 Report Summary

2. Change parameter: brand_id => String(9)


## Table of content


- 1. API information and path
- 2. DCS endpoint
   - 2.1 Login Game
      - Request
      - Response
   - 2.2 Try Game
      - Request
      - Response
   - 2.3 Report
      - Request restriction
      - Request
      - Response
      - Response information
      - Special Remarks
   - 2.4 Game Replay
      - Request
      - Response
      - Response information
   - 2.5 Get Game List
      - Request
      - Response
   - 2.6 FreeSpin Campaign Setup
      - Request
      - Response
      - Response information
   - 2.7 FreeSpin Campaign Player Setup
      - Request
      - Response
   - 2.8 FreeSpin Campaign Query
      - Request restriction
      - Request
      - Response
      - Response information
   - 2. 9 Report Summary
      - Request restriction
      - Request
      - Response
      - Response information
      - Important
- 3. Brand API endpoints implementation
   - 3.1 Login Authentication
      - Request
      - Response
   - 3.2 Wager
      - Request
      - Response
      - Special Remarks
   - 3.3 CancelWager
      - Request
      - Response
      - Special Remarks
   - 3.4 AppendWager
      - Request
      - Response
      - Special Remarks
   - 3.5 EndWager
      - Request
      - Response
      - Special Remarks
   - 3.6 FreeSpinResult......................................................................................................................
      - Request
      - Response
      - Special Remarks
   - 3.7 GetBalance
      - Request
      - Response
   - 3.8 PromoPayout
      - Request
      - Response
      - Special Remarks
- 4. Appendix
   - 4.1 DCS API Response Code


```
4.2 Currency code List ............................................................................................................. 42
4.3 Language code list ............................................................................................................. 46
4.4 Country_code .................................................................................................................... 48
4.5 Wager_type ....................................................................................................................... 48
4.6 Provider List....................................................................................................................... 49
```
DCS API Description

## 1. API information and path

```
Name Description
```
```
api_url API URL, DC provides to the Operator
```
```
getBetData_url Get bet detail URL, DC provides to the Operator
```
```
api_key Key used for endpoint validation, DC provides to the Operator
```
```
brand_id Brand ID, DC provides to the Operator
```
```
brandApi_url Brand api url, DC provides to the Operator
```
## 2. DCS endpoint

Request parameter “sign” is MD5 encrypted containing request info parameters + api_key.
When operator calls endpoint, the request info parameters will be different and required. api_key
is provided by DC. Additionally, please refer to Appendix 3. for parameters including currency,
country, and language.

Endpoint request method and content type：

```
Method Content Type
```
```
POST application/json
```
Endpoint request common parameters：

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```

```
sign Yes String32)
```
```
MD5 encryption and transform into CAPITAL
Encrypted detail will describe in each endpoint
Do not put “+” sign when concatenating messages
```
Endpoint response common parameters：

```
Name Required Type Description
```
```
code Yes Int Refer to DCS API Response code, check Appendix 4.
```
```
msg Yes String(50) Messages
```
### 2.1 Login Game

Login Game method allows players to log into the games. Operator receives launch url with game_url for the
game.

#### Request

EndPoint : {api_url}/dcs/loginGame

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) Sign = MD5(brand_id+brand_uid+api_key)
```
```
brand_uid Yes String( 20 )
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
token Yes String(32)
```
```
Operator provides token for player to launch the games,
DC api will request token verification to operator wallet api
(Please check login endpoint 3.1), recommend using
GUID (or any other unique identifier) to renew token
when player launches different game to avoid duplicate.
```
```
game_id Yes Int DC Game ID
```
```
currency Yes String(4) Player currency code, check Appendix 4.
```
```
language Yes String(7) Language showed in the game, check Appendix 4.
```

```
channel Yes String(6) ‘pc’ or ‘mobile’
```
```
country_code Yes String(2) Player country code, check Appendix 3.
```
```
return_url No String(50)
Use for home button or redirection URL (Only provided in
part of games)
```
```
full_screen No Boolean Full screen game display (Only provided in part of games)
```
#### Response

```
code Response
```
```
1000 {"code": 1000,"data": {"game_url":"http://xxxxxxxxxxx"},"msg": " Success."}
```
### 2.2 Try Game

This method allows players to launch the games in demo mode (without real money)

#### Request

EndPoint : {api_url}/dcs/tryGame

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+game_id+api_key)
```
```
game_id Yes Int DC Game ID
```
```
currency Yes String(4) Player currency code, check Appendix 4.
```
```
language Yes String(7) Language showed in the game, check Appendix 4.
```
```
channel Yes String(6) ‘pc’ or ‘mobile’
```
```
return_url No String(50)
Use for home button or redirection URL (Only provided in part
of games)
```
```
full_screen No Boolean Full screen game display (Only provided in part of games)
```

#### Response

```
code Response
```
```
1000 {"code": 1000,"data": {"game_url":"http://xxxxxxxxxxx"},"msg": " Success."}
```

### 2.3 Report

#### Request restriction

The interval between start_time and end_time must be within 24 hours. The data provided is
within 6 months. The frequency is 3 sec per request.

The api also supports the paging function. Operator passes the page parameter to 1 in the first
request of the same time interval. Each page can provide up to 5000 pieces of data. The total
number of pages can be calculated from the total_count parameter in the response information.
The calculation method is as follows: page.total_count/5000 unconditional carry to the integer.
Reports are generated in UTC time zone.

#### Request

EndPoint : {getBetData_url}/dcs/getBetData

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+start_time+end_time+api_key)
```
```
page Yes Int Page index
```
```
start_time Yes String(19) Starting time format (yyyy-MM-dd HH:mm:ss)
```
```
end_time Yes String(19) Ending time format (yyyy-MM-dd HH:mm:ss)
```
```
currency Yes String(4) Player currency code, check Appendix 4.
```
```
provider Yes String(20) Game provider code, check Appendix 4.
```
```
brand_uid No String(20)
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
#### Response

```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
```

```
"data": [
{
"brand_uid": "TestUser",
"currency": "CNY",
"wager_type": "endWager",
"amount": 10000.12,
"before_amount": 806585.06,
"after_amount": 816585.18,
"game_id": "7382",
"game_name": "Lucky Neko",
"round_id": "1905291058028500001",
"wager_id": "1905291058028500001",
"jackpot_contribution": 0.0,
"jackpot_win ": 0.0,
"description":"",
"create_time": "2019- 05 - 29 10:58:24",
"game_result":"{....}",
"tip":0.0,
"is_endround": false
}
],
"page":{
"current_page":1,
"total_count": 1
}
}
```
#### Response information

wager_type：Check Appendix 4.
page.current_page：Current page index
page.total_count：Total page count (5k results per page)

#### Special Remarks

When the Provider is SA Gaming and the game is Pok Deng, Player 1 to Player 5 will withhold 2
times of the bet amount.


### 2.4 Game Replay

The method returns player bet record replay for a specific round. The request restriction is 3
seconds per brand.

#### Request

EndPoint : {api_url}/dcs/getReplay

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+round_id+api_key)
```
```
brand_uid Yes String( 20 )
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4.
```
```
provider Yes String(20) Game provider code, check Appendix 4.
```
```
round_id Yes String( 64 ) Game round ID
```
#### Response

```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"record": "http://{xxxxxxxxxx}/replay/{roundid}",
"record_type": "URL",
}
}
```
#### Response information

There are three types of data.record_type,
Text：data.record output text format for game result


URL：data.record output URL format, operator needs to check the bet record via certain URL
Html：data.record output in HTML format for game result


### 2.5 Get Game List

#### Request

EndPoint : {api_url}/dcs/getGameList

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+api_key)
```
```
provider No String(20) Game provider code, check Appendix 4.
```
#### Response

```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": [
{
"provider": "yg",
"game_id": 7316,
"game_name": "Vikings go Wild",
"game_name_cn": "狂野北欧海盗",
"release_date": "2015- 07 - 31 ",
"rtp": "96.30%",
"game_icon": "https://XXXX?e=tIn7KM",
"content_type": "Standard",
"game_type": "SLOT ",
"content": "Yggdrasil"
}
]
}
```

### 2.6 FreeSpin Campaign Setup

This method allows to create FreeSpin Campaign

#### Request

EndPoint : {api_url}/dcs/createFreeSpin

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) Sign = MD5(brand_id+end_time+api_key)
```
```
game_id Yes Int DC Game ID for assigning freespin
```
```
currency Yes String(4) FreeSpin currency, check Appendix 4.
```
```
end_time
Yes
String(19)
Campaign end time, UTC time zone, format: yyyy-MM-dd
HH:mm:ss
```
```
description No String(100) FreeSpin campaign description
```
#### Response

```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"freespin_id": 10001,
"usable_amounts": [0.5, 2.0, 5.5]
}
}
```
#### Response information

data.usable_amounts: Only provider ‘yg, hs, png, nlc, evo’ responds a list of usable amounts.


### 2.7 FreeSpin Campaign Player Setup

This method allows operators to bind the FreeSpin Campaign to specific players.

#### Request

EndPoint : {api_url}/dcs/addFreeSpin

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) Sign = MD5(brand_id+freespin_id+api_key)
```
```
freespin_id Yes Long freespin_id from the response of 2.7 createFreeSpin
```
```
round_count Yes Int FreeSpin rounds
```
```
amount Yes Decimal(16, 6 )
```
```
Bet amount per FreeSpin
If the provider is yg, please put one of the values in
usable_amounts. No restriction for other provider, but
please make sure the amount is in bet limit.
```
```
brand_uids Yes List<String(20)>
```
```
Assign campaign to a list of brand_uid (Only support
english characters and numbers, case insensitive)
E.g.: "brand_uids": ["DemoUser01","DemoUser02"]
```
#### Response

```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"result": "Success."
}
}
```

### 2.8 FreeSpin Campaign Query

Operator can use the api to query details of existing FreeSpin Campaign.

#### Request restriction

◼ If start_after and end_before are not filled in, the default query is for FreeSpin created within
7 days.
◼ If start_after is filled in and end_before is not filled in, the query is 30 days after start_after.
◼ If start_after is not filled in and end_before is filled in, the query is 30 days before end_before.
◼ If both start_after and end_before are filled in, the query is up to 30 days; If freespin_uid is
filled in, there is no time limit.

#### Request

EndPoint : {api_url}/dcs/queryFreeSpin

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) Sign = MD5(brand_id+game_id+api_key)
```
```
game_id Yes Int DC Game ID for FreeSpin assigned
```
```
currency No String(4) FreeSpin currency, check Appendix 4.
```
```
freespin_id No Long freespin_id from the response of 2.1 2 createFreeSpin
```
```
brand_uid No String(20) Unique User ID from operator
```
```
start_after No String(19)
Campaign start time, UTC time zone, format: yyyy-MM-dd
HH:mm:ss
```
```
end_before No String(19)
Campaign end time, UTC time zone, format: yyyy-MM-dd
HH:mm:ss
```
#### Response

```
code Response
```
```
1000 {
"code": 1000,
```

```
"msg": "Success.",
"data": [
{
"freespin_id": 10001,
"start_time": "202 2 - 08 - 20 00 : 0 0: 00 ",
"end_time": "2022- 08 - 30 00:00:00",
"provider": "yg",
"game_id": 880001 ,
"currency": "CNY",
"status":0,
"round_count":10,
"amount":2.65,
"brand_uids": [
"DemoUser01",
"DemoUser02"
],
"create_time" : "2022- 07 - 01 14:50:00"
}
]
}
```
#### Response information

data.status corresponding status info：
0: Built；1: Players assigned；2: Campaign activated；3: Cancelled；4: Application failed


### 2. 9 Report Summary

Retrieve the daily aggregated betting data per player.

#### Request restriction

The data provided is within 6 months. The frequency is 3 sec per request.

The api also supports the paging function. Operator passes the page parameter to 1 in the first
request of the same time interval. Each page can provide up to 5000 pieces of data. The total
number of pages can be calculated from the total_count parameter in the response information.
The calculation method is as follows: page.total_count/5000 unconditional carry to the integer.
Reports are generated in UTC time zone.

Due to data processing time, if the date is set to today, data from the most recent 10 minutes may
not yet be included in the query results.

#### Request

EndPoint : {getBetData_url}/dcs/getUsersBetSummary

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) Sign = MD5(brand_id+date+api_key)
```
```
page Yes Int Page index
```
```
date Yes String(1 0 ) format (yyyy-MM-dd)
```
```
provider No String(20) Game provider code, check Appendix 3.6
```
```
brand_uid No String( 20 ) Unique User ID from operator
```
#### Response

```
code Response
```
```
1000 {
"data": [
{
"brand_uid": "TestUser",
```

```
"currency": "CNY",
"provider": "yg",
"bet_type": "Prepaid bet",
"bet_count": 2,
"bet_amt": 4.00,
"win_amt": 0.00,
"jackpot_contribution": 0.000000,
"jackpot_win": 0.00,
"tip": 0.000000
},
{
"brand_uid": "TestUser",
"currency": "CNY",
"provider": "sb",
"bet_type": "Normal bet",
"bet_count": 271,
"bet_amt": 813.00,
"win_amt": 727.88,
"jackpot_contribution": 0.000000,
"jackpot_win": 0.00,
"tip": 0.000000
}
],
"page": {
"current_page": 1,
"total_count": 2
},
"code": 1000,
"msg": "Success."
}
```
#### Response information

◼ page.current_page：Current page index
◼ page.total_count：Total page count (5k results per page)


#### Important

When the Provider is SA Gaming and the game is Pok Deng, Player 1 to Player 5 will withhold 2
times of the bet amount.

## 3. Brand API endpoints implementation

Operator must implement all API endpoints. Corresponding requests and the response
parameters are described in detail.

DC requests operator brand API endpoints in POST method. The sign parameter is MD5 encrypted,
operator must affirm the parameters are not tampered.

```
Method Content Type
```
```
POST application/json
```
Endpoint request common parameters：

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32)
```
```
MD5 encryption and transform into CAPITAL
Encrypted detail will describe in each endpoint
Do not put “+” sign when concatenating messages
```
Endpoint response common parameters：

```
Name Required Type Description
```
```
code Yes Int Refer to DCS API Response code, check Appendix 4.1
```
```
msg Yes String(50) Messages
```

### 3.1 Login Authentication

Operator is obligated to implement login endpoint in order to run gameplay. Token validation
is required from providers so operator should respond the corresponding information to the login

#### Request

### Request

EndPoint : {brandApi_url}/login

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+token+api_key)
```
```
token Yes String(32)
Token is created by operator, only allowed the combination of
English letters and numbers
```
```
brand_uid Yes String( 20 )
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4 .2
```
#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String( 20 ) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```

##### 1000 {

```
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```

### 3.2 Wager

Operator is obliged to implement wager endpoint in order to run gameplay. If there is same
wager request (identified by round_id and wager_id), or the wager has been cancelled, operator
should not execute but return success response with player current balance. Noted that multiple
wager_id may happen in same round_id in case the game has several buy-ins.

#### Request

EndPoint : {brandApi_url}/wager

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+wager_id+api_key)
```
```
token Yes String(32)
Token is created by operator, only allowed the
combination of English letters and numbers
```
```
brand_uid Yes String( 20 )
Unique User ID from operator (Only support
english characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
amount Yes Decimal(16, 6 ) Bet amount
```
```
jackpot_contribution Yes Decimal(16,6)
A portion of player bet amount add to Jackpot
feed
```
```
game_id Yes Int DC game ID
```
```
game_name Yes String(50) DC Game Name
```
```
round_id Yes String(64) Unique bet round identifier
```
```
wager_id Yes String(64) Unique transaction identifier within a bet round
```
```
provider Yes String(20) Game provider code, check Appendix 4 .6
```
```
bet_type Yes Int 1=Normal; 2=Tip
```
```
is_endround Yes Boolean false= Unfinished, true= Round Finish
```
```
transaction_time Yes String( 2 0) The format is: yyyy-MM-ddTHH:mm:ssZ
```

#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(2 0 ) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```
#### Special Remarks

1. All communications with the wallet are handled idempotently. If the merchant receives a
    duplicate wager request that has already been successfully processed (identified by
    round_id and wager_id), please respond with code: 5043, and return data.brand_uid,
    data.currency, data.balance without modifying the balance again.
2. Return code: 5003 with data.brand_uid, data.currency, data.balance if player has
    insufficient balance
3. When the Provider is SA Gaming and the game is Pok Deng, Player 1 to Player 5 will
    withhold 2 times of the bet amount.


### 3.3 CancelWager

Operator is obliged to implement cancelWager endpoint in order to run gameplay. If the
operator has cancelled the wager (identical round_id and wager_id), operator should not execute
the same request but return current balance in the response.

#### Request

EndPoint : {brandApi_url}/cancelWager

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+wager_id+api_key)
```
```
brand_uid Yes String( 20 )
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4.2
```
```
round_id Yes String(64) Unique bet round identifier
```
```
wager_id Yes String(64) Unique transaction identifier within a bet round
```
```
provider Yes String(20) Game provider code, check Appendix 4 .6
```
```
wager_type Yes Int 1=cancelWager, 2=cancelEndWager
```
```
is_endround Yes Boolean false= Unfinished, true= Round Finish
```
```
transaction_time Yes String(20) The format is: yyyy-MM-ddTHH:mm:ssZ
```
#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(2 0 ) Unique User ID from operator
```

```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```
#### Special Remarks

1. All communications with the wallet are handled idempotently. If the merchant receives a
    duplicate cancelWager request that has already been successfully processed (identified by
    round_id and wager_id), please respond with code: 5043, and return data.brand_uid,
    data.currency, data.balance without modifying the balance again.
2. Return code:5042 with data.brand_uid, data.currency, and data.balance if operator does
    not have the wager_id to be cancelled.
3. When the wager_type is 1, the wager round should be cancelled, i.e., return/increase the
    amount to the player wallet. When wager_type is 2, the endWager round should be
    cancelled, i.e., deduct/reduce the amount to the player's wallet.


### 3.4 AppendWager

Operator is obliged to implement AppendWager endpoint in order to run gameplay. This
method is used for the result of jackpot game. Operator must payout the bonus unless same
appendWager (identical round_id and wager_id) has executed.

#### Request

EndPoint : {brandApi_url}/appendWager

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+wager_id+api_key)
```
```
brand_uid Yes String(2 0 )
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
amount Yes Decimal(16, 6 ) Player jackpot winning amount
```
```
game_id Yes Int DC game ID
```
```
game_name Yes String(50) DC Game Name
```
```
round_id Yes String(64) Unique bet round identifier
```
```
wager_id Yes String(64) Unique transaction identifier within a bet round
```
```
provider Yes String(20) Game provider code, check Appendix 4 .6
```
```
description Yes String(100) Description of appendWager
```
```
is_endround Yes Boolean false= Unfinished, true= Round Finish
```
```
transaction_time Yes String(20) The format is: yyyy-MM-ddTHH:mm:ssZ
```
#### Response

```
Name Required Type Description
```

```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(20) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```
#### Special Remarks

1. All communications with the wallet are handled idempotently. If the merchant receives a
    duplicate appendWager request that has already been successfully processed (identified by
    round_id and wager_id), please respond with code: 5043, and return data.brand_uid,
    data.currency, data.balance without modifying the balance again.


### 3.5 EndWager

Operator is obliged to implement EndWager endpoint in order to run gameplay. This method
is used to payout the winning amount for a normal round. If operator has executed the same
endWager (identical round_id and wager_id), the current player info will be returned in response.

#### Request

EndPoint : {brandApi_url}/endWager

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+wager_id+api_key)
```
```
brand_uid Yes String(2 0 )
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
amount Yes Decimal(16, 6 ) Player winning amount in normal round
```
```
round_id Yes String(64) Unique bet round identifier
```
```
wager_id Yes String(64) Unique transaction identifier within a bet round
```
```
provider Yes String(20) Game provider code, check Appendix 4 .6
```
```
is_endround Yes Boolean false= Unfinished, true= Round Finish
```
```
game_result No String(4000)
Only Ezugi has game result, the other provider will
be null
```
```
transaction_time Yes String(20) The format is: yyyy-MM-ddTHH:mm:ssZ
```
#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```

```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(20) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```
#### Special Remarks

1. All communications with the wallet are handled idempotently. If the merchant receives a
    duplicate endWager request that has already been successfully processed (identified by
    round_id and wager_id), please respond with code: 5043, and return data.brand_uid,
    data.currency, data.balance without modifying the balance again.
2. Return code:5042 with data.brand_uid, data.currency, and data.balance if operator does
    not have the round_id to finish the round.


### 3.6 FreeSpinResult......................................................................................................................

Operator is obliged to implement FreeSpinResult endpoint in order to run gameplay. The total
winning amount during the campaign will be aggregated in one request.

#### Request

EndPoint : {brandApi_url}/freeSpinResult

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+wager_id+api_key)
```
```
brand_uid Yes String(20)
Unique User ID from operator (Only support
english characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
amount Yes Decimal(16, 6 ) Player winning amount in campaign
```
```
game_id Yes Int DC game ID
```
```
game_name Yes String(50) DC Game Name
```
```
round_id Yes String(64) Unique bet round identifier
```
```
wager_id Yes String(64) Unique transaction identifier within a bet round
```
```
provider Yes String(20) Game provider code, check Appendix 4 .6
```
```
is_endround Yes Boolean false= Unfinished, true= Round Finish
```
```
freespin_id No Long
freespin_id from the response of 2.7
createFreeSpin
```
```
freespin_description No String(100) FreeSpin campaign description
```
```
transaction_time Yes String(20) The format is: yyyy-MM-ddTHH:mm:ssZ
```

#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(20) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```
#### Special Remarks

1. All communications with the wallet are handled idempotently. If the merchant receives a
    duplicate freeSpinResult request that has already been successfully processed (identified by
    round_id and wager_id), please respond with code: 5043, and return data.brand_uid,
    data.currency, data.balance without modifying the balance again.


### 3.7 GetBalance

Operator is obliged to implement getBalance endpoint in order to run gameplay. Response
will be player current balance.

#### Request

EndPoint : {brandApi_url}/getBalance

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32) sign = MD5(brand_id+token+api_key)
```
```
brand_uid Yes String(20)
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
token Yes String(32)
Token created by operator, only allowed the combination of
English letters and numbers
```
#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(20) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4 .2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
```

```
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.5 5
}
}
```
### 3.8 PromoPayout

This api will be sending promotional bonuses, adding the amount directly to the player wallet

#### Request

EndPoint : {brandApi_url}/promoPayout

```
Name Required Type Description
```
```
brand_id Yes String( 9 ) Brand ID
```
```
sign Yes String(32)
sign =
MD5(brand_id+promotion_id+trans_id+api_key)
```
```
brand_uid Yes String(20)
Unique User ID from operator (Only support english
characters and numbers, case insensitive)
```
```
currency Yes String(4) Player currency code, check Appendix 4.2
```
```
amount Yes Decimal(16, 6 ) Promo bonus
```
```
promotion_id Yes String(36) Promotion id
```
```
trans_id Yes String(128) Trans id
```
```
provider Yes String(16) Game provider code, check Appendix 4.6
```
```
transaction_time Yes String(20) The format is: yyyy-MM-ddTHH:mm:ssZ
```

#### Response

```
Name Required Type Description
```
```
code Yes Int DCS API Response Code, check Appendix 4.1
```
```
msg Yes String(50)
If the request info is valid, please respond with
message “Success”.
```
```
data.brand_uid Yes String(20) Unique User ID from operator
```
```
data.currency Yes String(4) Player currency code, check Appendix 4.2
```
```
data.balance Yes Decimal(16, 6 ) Player current balance
```
```
code Response
```
```
1000 {
"code": 1000,
"msg": "Success.",
"data": {
"brand_uid": "testUser",
"currency": "IDR",
"balance": 25.55
}
}
```
#### Special Remarks

2. All communications with the wallet are handled idempotently. If the merchant receives a
    duplicate promoPayout request that has already been successfully processed (identified by
    promotion_id and trans_id), please respond with code: 5043, and return data.brand_uid,
    data.currency, data.balance without modifying the balance again.


## 4. Appendix

### 4.1 DCS API Response Code

```
Code Remark Description
```
```
1000 Success. Success
```
```
1001 System error. System error
```
```
1002 Unknown. Unknown error
```
```
5000 Sign error. Verification code error
```
```
5001 Request param error. Request parameter error
```
```
5002 Currency not support. Currency not supported
```
```
5003 Balance insufficient. Insufficient balance
```
```
5005 Brand not exist. Brand does not exist
```
```
5008 Country Code error. Country code error
```
```
5009 Player not exist. Player's account or token does not exist
```
```
5010 Player blocked. Player blocked
```
```
5012 Game id not exist. Game id does not exist
```
```
5013 Not logged in.
Session authentication failed, token does
not match with player
```
```
5014 Incorrect time format. Invalid time format
```
```
5015 Incorrect provider. Invalid provider
```
```
5016 Incorrect amount. Invalid amount
```
```
5017 Api insufficient permission. Api has insufficient permission
```
```
5018 Incorrect brand uid. Incorect brand_uid
```
##### 5040

```
Request rate limit, once request per 3
seconds.
```
```
Request limit reached, once every 3
seconds.
```

##### 5041

```
Request date range limit, once request time
period can only be within 24 hours. request
time can only be within 6 months.
```
```
Request segment limit, each request
segment must not exceed 24 hours, in
addition, the information can be inquired
only within 6 months period.
```
5042 Bet record not exist. Bet record does not exist.

5043 Bet record duplicate. Bet record is duplicated/identical.

5070 Free spin ID not exist. Free spin ID does not exist.

5071 Incorrect round count. Invalid spin count

5072 The free spin already cancelled. This free spin has been cancelled.

5073 The free spin already locked.
This free spin has been locked, unable to
alter.

5074 The provider does not support free spin.
This provider does not support assigning
freespin to players.

5075 The free spin set up error. The free spin setup has an error.

5019 Provider is maintaining Provider is under maintenance

5020 Brand locked Brand locked

5021 No support try game Try game is not supported

5023 No support get replay Replay is not supported

5024 Token cannot be used Token cannot be used

5025 Unsupported method Unsupported method


### 4 .2 Currency code List

Please refer to ISO 4217 currency codes, different provider supports different currencies.

```
Code Remark Description
AED United Arab Emirates Dirham UAE Dirham
AFN Afghan Afghani Afghan Afghani
ALL Albanian Lek Albanian Lek
AMD Armenian Dram Armenian Dram
ANG Netherlands Antillean Guilder Netherlands Antillean Guilder
AOA Angolan Kwanza Angolan Kwanza
ARS Argentine Peso Argentine Peso
AUD Australian Dollar Australian Dollar
AZN Azerbaijan Manat Azerbaijan Manat
BAM Bosnia and Herzegovina convertible mark Bosnia and Herzegovina convertible Mark
BDT Bangladeshi Taka Bangladeshi Taka
BGN Bulgarian Lev Bulgarian Lev
BHD Bahrain Dinar Bahrain Dinar
BND Brunei Dollar Brunei Dollar
BOB Bolivian Boliviano Bolivian Boliviano
BRL Brazilian Real Brazilian Real
BWP Botswanan Pula Botswanan Pula
BYN Belarusian Ruble Belarusian Ruble
BZD Belize Dollar Belize Dollar
CAD Canadian Dollar Canadian Dollar
CDF Congolese Franc Congolese Franc
CHF Swiss Franc Swiss Franc
CLP Chilean Peso Chilean Peso
CNY Chinese Yuan Chinese Yuan
COP Colombian Peso Colombian Peso
CRC Costa Rican Colón Costa Rican Colón
CUP Cuban Peso Cuban Peso
```

CZK Czech Koruna Czech Koruna

DKK Danish Krone Danish Krone

DOP Dominican Peso Dominican Peso

DZD Algerian Dinar Algerian Dinar

EGP Egyptian Pound Egyptian Pound

ETB Ethiopian Birr Ethiopian Birr

EUR Euro Euro

GBP Pound Sterling Pound Sterling

GEL Georgian Lari Georgian Lari

GHS Ghanaian Cedi Ghanaian Cedi

GMD Gambian Dalasi Gambian Dalasi

GNF Guinean Franc Guinean Franc

GTQ Guatemalan Quetzal Guatemalan Quetzal

HKD Hong Kong Dollar Hong Kong Dollar

HNL Honduran Lempira Honduran Lempira

HRK Croatian Kuna Croatian Kuna

HTG Haitian Gourde Haitian Gourde

HUF Hungarian Forint Hungarian Forint

IDR Indonesian Rupiah Indonesian Rupiah

IDX Thousand Indonesian Rupiah Indonesian Rupiah/1000

ILS Israeli New Shekel Israeli New Shekel

INR Indian Rupee Indian Rupee

IQD Iraqi Dinar Iraqi Dinar

IRR Iranian rial Iranian rial

ISK Icelandic Krona Icelandic Krona

JMD Jamaican Dollar Jamaican Dollar

JOD Jordanian Dinar Jordanian Dinar

JPY Japanese Yen Japanese Yen

KES Kenyan Shilling Kenyan Shilling

KGS Kyrgystani Som Kyrgyzstani Som


KHR Cambodian Riel Cambodian Riel

KRW South Korean Won South Korean Won

KWD Kuwaiti Dinar Kuwaiti Dinar

KZT Kazakhstani Tenge Kazakhstani Tenge

LAK Lao Kip Lao Kip

LBP Lebanese Pound Lebanese Pound

LKR Sri Lankan Rupee Sri Lankan Rupee

LRD Liberian dollar Liberian Dollar

LSL Basotho Loti Basotho Lotu

LVL Latvia Lat Latvia Lat

MAD Moroccan Dirham Moroccan Dirham

MDL Moldovan Leu Moldovan Leu

MGA Ariary Ariary

MKD Macedonian Denar Macedonian Denar

MMK Myanmar Kyat Myanmar Kyat

MNT Mongolian Tugrik Mongolian Tugrik

MOP Macau Pataca Macau Pataca

MUR Mauritian Rupee Mauritian Rupee

MVR Maldivian Rufiyaa Maldivian Rufiyaa

MWK Malawian kwacha Malawian Kwacha

MXN Mexican Peso Mexican Peso

MYR Malaysian Ringgit Malaysian Ringgit

MZN Mozambican Metical Mozambican Metical

NAD Namibian Dollar Namibian Dollar

NGN Nigerian Naira Nigerian Naira

NIO Nicaraguan Córdoba Nicaraguan Córdoba

NOK NOK Norwegian Krone

NPR Nepalese Rupee Nepalese Rupee

NZD New Zealand Dollar New Zealand Dollar

OMR Omani Rial Omani Rial


PAB Panamanian Balboa Panamanian Balboa

PEN Peruvian Nuevo Sol Peruvian Nuevo Sol

PHP Philippine Peso Philippine Peso

PKR Pakistan Rupee Pakistan Rupee

PLN Polish Zloty Polish Zloty

PYG Paraguayan Guarani Paraguayan Guarani

QAR Qatari Rial Qatari Rial

RON Romanian Dram Romanian Dram

RSD Serbian Dinar Serbian Dinar

RUB Russian Ruble Russian Ruble

RWF Rwandan franc Rwandan Franc

SAR Saudi Riyal Saudi Riyal

SCR Seychellois Rupee Seychellois Rupee

SDG Sudanese Pound Sudanese Pound

SEK Swedish Krona Swedish Krona

SGD Singapore Dollar Singapore Dollar

SRD Surinamese Dollar Surinamese Dollar

SZL Swazi Lilangeni Swazi Lilangeni

TGC TGC point TGC point

THB Thai Baht Thai Baht

TJS Tajikistani Somoni Tajikistani Somoni

TMT Turkmenistani Manat Turkmenistani Manat

TND Tunisian Dinar Tunisian Dinar

TRY Turkish Libra Turkish Libra

TTD Trinidad and Tobago Dollar Trinidad and Tobago Dollar

TZS Tanzanian Shilling Tanzanian Shilling

UAH Ukrainian Hryvnia Ukrainian Hryvnia

USD United States Dollar United States Dollar

UYU Uruguayan Peso Uruguayan Peso

UZS Uzbekistani Som Uzbekistani Som


```
VND Vietnamese Dong Vietnamese Dong
VNX Thousand Vietnamese Dong Vietnamese Dong/1000
XAF Central African CFA Franc Central African CFA Franc
XCD East Caribbean Dollar East Caribbean Dollar
XOF CFA Franc BCEAO CFA Franc BCEAO
YER Yemeni Rial Yemeni Rial
ZAR South African Rand South African Rand
ZM Zambian Kwacha Zambian Kwacha
ZWL Zimbabwean Dollar Zimbabwean Dollar
BTP BT Points BT Points
USDT Tether Tether(USDT)
VES Bolívar Soberano Bolívar Soberano
SSP South Sudanese Pound South Sudanese Pound
```
### 4. 3 Language code list

```
Code Remark Description
zh_hans Simplified Chinese Simplified Chinese
zh_hant Traditional Chinese Traditional Chinese
ko Korean Korean
kr Korean Korean
en English English
th Thai Thai
vi Vietnamese Vietnamese
id Indonesian Indonesian
ja Japanese Japanese
bg Bulgarian Bulgarian
cz Czech Czech
de German German
el Greek Greek
tr Turkish Turkish
```

es Spanish Spanish

fi Finnish Finnish

fr French French

hu Hungarian Hungarian

it Italian Italian

nl Dutch Dutch

no Norwegian Norwegian

pl Polish Polish

pt Portuguese Portuguese

pt-BR Brazilian-Portuguese Brazilian-Portuguese

ro Romanian Romanian

ru Russian Russian

sk Slovak Slovak

sv Swedish Swedish

da Danish Danish

ka Georgian Georgian

lv Latvian Latvian

uk Ukrainian Ukrainian

et Estonian Estonian


### 4 .4 Country_code

Please refer to ISO 3166-1 Alpha 2 country coder, below are some examples

```
Code Remark Description
CN China China
HK Hong Kong Hong Kong
TW Taiwan Taiwan
KR South Korea South Korea
JP Japan Japan
TH Thailand Thailand
PH Philippines Philippines
ID Indonesia Indonesia
IN India India
VN Vietnam Vietnam
MY Malaysia Malaysia
SG Singapore Singapore
```
### 4 .5 Wager_type

```
Code Description
wager Bet
endWager Finish bet
cancelWager Cancel bet, due to internal error (bet amount refund to player)
appendWagerResult Appears in jackpot and prizedrop
campaign Free Spin Bet record (Only appears in Backoffice)
campaignpayout Player’s profit from prepaid free spin campaign
```
```
cancelEndWager Cancellation of payout due to internal error (deducting the amount paid
to the player from the player's wallet balance)
```
```
promopayout send promotional bonuses, adding the amount directly to the player
wallet
```

### 4 .6 Provider List

```
Code Description
dcace DCACE
```
```
yg Yggdrasil
```
```
relax Relax gaming
```
```
nlc Nolimit City
```
```
png Play'n Go
```
```
hs Hacksaw Gaming
```
```
aux Avatar UX
```
```
evo Evoplay
```
```
gam Gamomat
```
```
psh Push Gaming
```
```
ezugi Ezugi
```
```
swf Win Fast
```
```
funta FunTa Gaming
```
```
stm Slotmill
```
```
mj 7Mojos
```
```
fm Fantasma
```
```
ps Peter & Sons
```
```
sb Spribe
```
```
plb Parlay bay
```
```
evl Evolution
```
```
btg Big Time Gaming
```

ne NetEnt

rt Red Tiger

tg

tgo

```
Turbo Games
```
```
Turbo Games (non-Asian market)
```
wz Voltent (Wazdan)

tk Thunderkick

lm Lucky Monaco

yt Yolted

sa SA Gaming

ss Smartsoft^

bg Bgaming^

nm Novomatic

op Octoplay

bp BluePrint

hso Hacksaw Gaming ROW

hsl Hacksaw Gaming Latam

tq Originals (Tequity)

raw RAW

bm Booming Games

ag PlayACE

pts Play Tech Slot

ptc PlayTech Casino


