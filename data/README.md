# Documentation

## Data codebook

Listed in order of appearance in the file index.js

**cd-boundaries-albers.geojson** – community district boundaries
|Feature Name | Description|
|--------|:------|  
|Features| Polygons and properties of each community district|
|Name | Name of file|
|Type | Type of data|

**adoptedtotal.csv** – aggregated initial funding for all agencies per fiscal year
|Feature Name | Description|
|--------|:------|  
|Year |Fiscal year of budget|
|Adopted |Total amount initially awarded to all agencies|

**commboards.csv** – a subset of the budget data centered around Community Boards
|Feature Name | Description|
|--------|:------|  
|Accrued Expense An accounting expense recognized by the City before it is paid for|
|Adopted |Initially allocated funds (before any modifications during the year)|
|Agency |City agencies and departments; in this dataset, lists Community Boards|
|CBnum |Column created to match Community Board with its relevant district|
|Budget Code |Internal code used by the Comptroller’s office for classification|
|Budget Name |Classification name for allocated funds|
|Cash Expense |Liquid funds, which can be an expense or revenue.|
|Department |High-level description of where the allocated funds will be used|
|Encumbered |Amounts committed to pay for goods and services in contract but that have not been received yet|
|Expense Category |Granular description of what the allocated funds will be used for|
|Modified |Budget allocations reflecting changes made to the Adopted budget after the start of the fiscal year|
|Post Adjustments| Events after the date of the financial statements which result in adjustments to the financial statements when they are next issued|
|Pre-Encumbered |Amount expected to spend, but for which there is no legal obligation to spend|
|Year |Fiscal year of budget|

**tenmil-withpercent.csv** – describes services that can be funded with $10 million
|Feature Name | Description|
|--------|:------|  
|Division| Category of selected service|
|Part |Amount of the service that $10 million can fund|
|Total |Total amount for the year|
|Unit |Description of service in prose|
|Percent |Percent of service that can be funded with $10 million for the year (calculated by dividing “part” by “total” and multiplying by 100)|
|Unitprice| Unit price of service (calculated by dividing 10 million by “part” for each item)|
|Totalprice |Total price of individual service (calculated by multiplying “unitprice” by “total” for each item)|

**dates21.csv** – a list of all dates in 2021
|Feature Name | Description|
|--------|:------|  
|Date |Dates for the calendar year 2021|

**dates-partial-half1.csv** – dates for FY 2021 in the second half of 2021
|Feature Name | Description|
|--------|:------|  
|Date| Dates for Fiscal Year 2021/Fiscal Year 2022 planning (July 1 – December 31, 2021)|

**dates-partial-half2.csv** - dates for FY 2021 in the first half of 2022
|Feature Name | Description|
|--------|:------|  
|Date| Dates for Fiscal Year 2021/Fiscal Year 2022 planning (January 1 – June 30, 2022)|

**topten-mod-total.csv** – top ten agencies and departments by Modified funding, FY 2017-2021
|Feature Name | Description|
|--------|:------|  
|Agency| City agencies and departments|
|2017| FY 2017 aggregated amounts (Modified allocation values)|
|2018| FY 2018 aggregated amounts (Modified allocation values)|
|2019| FY 2019 aggregated amounts (Modified allocation values)|
|2020| FY 2020 aggregated amounts (Modified allocation values)|
|2021| FY 2021 aggregated amounts (Modified allocation values)|

**commboard-totals.csv** – aggregated community boards by borough with Modified funding as values, FY 2017-2021
|Feature Name | Description|
|--------|:------|  
|Borough |Boroughs of New York City|
|2017| FY 2017 aggregated amounts (Modified allocation values)|
|2018| FY 2018 aggregated amounts (Modified allocation values)|
|2019| FY 2019 aggregated amounts (Modified allocation values)|
|2020| FY 2020 aggregated amounts (Modified allocation values)|
|2021| FY 2021 aggregated amounts (Modified allocation values)|

**commsmod.csv** – budget funds aggregated by individual community board with borough attached
|Feature Name | Description|
|--------|:------|  
|Year |Fiscal year of budget|
|Agency |City agencies and departments (community boards only in this particular dataset)|
|Adopted |Initially allocated funds (before any modifications during the year), aggregated by Community Board|
|Modified |Budget allocations reflecting changes made to the Adopted budget after the start of the fiscal year, aggregated by Community Board|
|Borough |Boroughs of New York City|
