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
    DisableEnable;
    SubsidiaryId;
    ComCode;
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

    subsidiary_id;
    com_code;
    from_port_id;
    from_port_name;
    to_port_id;
    to_port_name;
    etd;
    eta;
    voyage;
    modify_date;
    imp_exp;
    service;
    from_sch_cy;
    from_sch_cfs;
    from_sch_rece;
    from_sch_si;
    from_sch_vgm;
    ts_port_name;
    vessel_2;
    voyage_2;
    DisableEnable;
    masterSetting;
}
export class scrapReport {
    from;
    to;
    fromTime;
    toTime;
}
