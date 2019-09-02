USE [Scraper]
GO
/** Object:  StoredProcedure [dbo].[Sp_LoadDetailsSetting]    Script Date: 09/03/2019 10:31:28 **/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER Proc [dbo].[Sp_LoadDetailsSetting] @FkSite int ,@RowID int=0
AS 
BEGIN
  Set NOCOUNT ON

		   if  @RowID<>-1

			  Select top 1000 [FldPkDetailsSetting],fport.port_name as fromPortname ,FldFkFromPort as fromPortcode
			  ,tport.port_name as toPortname ,FldFkToPort as toPortcode
			  From  [dbo].[TblDetailsSetting] D
			  inner join [dbo].[TblMasterSetting] m 
			  ON     M.[FldPkMasterSetting]=D.[FldFkMasterSetting] inner join [dbo].[port] as fport
			  on [FldFkFromPort]=fport.port_id  inner join [dbo].[port] as tport
			  on [FldFktoPort]=tport.port_id
			  Where  [FldFkSite]=@FkSite  and (   @RowID=0  or [FldPkDetailsSetting]>@RowID  )
			Order by [FldPkDetailsSetting]


		  if @rowID =-1

		  Select  [FldPkDetailsSetting],fport.port_name as fromPortname ,FldFkFromPort as fromPortcode
		  ,tport.port_name as toPortname ,FldFkToPort as toPortcode
		  From  [dbo].[TblDetailsSetting] D
		  inner join [dbo].[TblMasterSetting] m 
		  ON     M.[FldPkMasterSetting]=D.[FldFkMasterSetting] inner join [dbo].[port] as fport
		  on [FldFkFromPort]=fport.port_id  inner join [dbo].[port] as tport
		  on [FldFktoPort]=tport.port_id
		  Where  [FldFkSite]=@FkSite  
		Order by [FldPkDetailsSetting]	
END