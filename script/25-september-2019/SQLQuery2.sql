USE [Scraper]
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadDetailsSetting]    Script Date: 09/23/2019 12:44:24 ب.ظ ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create  Proc [dbo].[Sp_LoadAllPortPair]  @RowIDAs int=-1,@RowIDTa int=-1
AS 
BEGIN
  Set NOCOUNT ON

	


			  Select row_Number() over(order by [FldPkDetailsSetting]), [FldPkDetailsSetting],fport.port_name as fromPortname ,FldFkFromPort as fromPortcode
		  ,tport.port_name as toPortname ,FldFkToPort as toPortcode
		  From  [dbo].[TblDetailsSetting] D
		  inner join [dbo].[TblMasterSetting] m 
		  ON     M.[FldPkMasterSetting]=D.[FldFkMasterSetting] inner join [dbo].[port] as fport
		  on [FldFkFromPort]=fport.port_id  inner join [dbo].[port] as tport
		  on [FldFktoPort]=tport.port_id
		  
		Order by [FldPkDetailsSetting]	

END
