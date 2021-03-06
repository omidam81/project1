USE [Scraper]
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadAllPortPair]    Script Date: 09/26/2019 01:13:26 ب.ظ ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER  Proc [dbo].[Sp_LoadAllPortPair]  @RowID int=-1
AS 
BEGIN
  Set NOCOUNT ON

		   if  @RowID<>-1

			  Select top 10 [FldPkDetailsSetting],fport.port_name as fromPortname ,FldFkFromPort as fromPortcode
			               ,tport.port_name as toPortname ,FldFkToPort as toPortcode
			  From  [dbo].[TblDetailsSetting] D
			  inner join [dbo].[TblMasterSetting] m 
			  ON     M.[FldPkMasterSetting]=D.[FldFkMasterSetting] inner join [dbo].[port] as fport
			  on [FldFkFromPort]=fport.port_id  inner join [dbo].[port] as tport
			  on [FldFktoPort]=tport.port_id
			  Where (    [FldPkDetailsSetting]>@RowID  )
			Order by [FldPkDetailsSetting]


		  if @rowID =-1

		  Select top 10 [FldPkDetailsSetting],fport.port_name as fromPortname ,FldFkFromPort as fromPortcode
		  ,tport.port_name as toPortname ,FldFkToPort as toPortcode
		  From  [dbo].[TblDetailsSetting] D
		  inner join [dbo].[TblMasterSetting] m 
		  ON     M.[FldPkMasterSetting]=D.[FldFkMasterSetting] inner join [dbo].[port] as fport
		  on [FldFkFromPort]=fport.port_id  inner join [dbo].[port] as tport
		  on [FldFktoPort]=tport.port_id
		  
		Order by [FldPkDetailsSetting]	
END
