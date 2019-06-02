export class PortOData {
    portName;
    PortCode;
}
export class SiteSetting {
    siteId;
    portsList;
    Time;
    scheduleTime;
}
export class PortToPort {
    from;
    to;
    siteId;
}
export class siteSetting {
    SiteId;
    Time;
    TypeSchedule;
    DayOfMounth;
    LenghtToScraping;
    String;
}
export class Route {
    from;
    to;
    inland;
    portTime;
    depDate;
    arrivalDate;
    vessel;
    ocean;
    total;
    siteId;
}
export class scrapReport{
    from;
    to;
    fromTime;
    toTime;
}
