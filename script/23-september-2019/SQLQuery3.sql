create Proc Sp_LoadNewPort
as
begin

select [port_id],[port_name] from [dbo].[port]
where [port_id] not in (
select [FldFkFromPort] from [dbo].[TblDetailsSetting]
union
select [FldFkToPort] from [dbo].[TblDetailsSetting])
end
