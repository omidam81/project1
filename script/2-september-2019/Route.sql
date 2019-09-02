USE [Route]
GO
/** Object:  StoredProcedure [dbo].[Sp_InsertRoute]    Script Date: 09/03/2019 10:19:49 **/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER Proc [dbo].[Sp_InsertRoute](
	
    @from_port_id char(20) ,
	@from_port_name varchar(100) ,
	@to_port_id char(20) ,
	@to_port_name varchar(100) ,
	@etd datetime ,
	@eta datetime ,
	@vessel varchar(100) ,
	@voyage varchar(100) ,
	@modify_date datetime ,
	@imp_exp char(1) ,
	@service varchar(254) ,
	@from_sch_cy datetime ,
	@from_sch_cfs datetime ,
	@from_sch_rece datetime ,
	@from_sch_si datetime ,
	@from_sch_vgm datetime ,
	@ts_port_name varchar(100) ,
	@vessel_2 varchar(100) ,
	@voyage_2 varchar(100) ,
    @FkSite int,
	@DisableEnable bit,@Subsidiary_id char(20),@com_code varchar(50) ,@FldFkMasterRoute int)
 AS
 BEGIN
-- Declare @FkFromPort int,@FkToPort int
 
--
-- select @FkFromPort=(select [FldPkPort] from[Port].[dbo].[TblPort] where  [port_id]= @from_port_id)
-- Select @FkToPort=(select [FldPkPort] from[Port].[dbo].[TblPort] where  [port_id]=@to_port_id)

-- select 
--	@DisableEnable= [DisableEnable], 
--	@Subsidiary_id = [Subsidiary_id], 
--	@com_code = [com_code]
-- From   [dbo].[TblMasterRoute]
--	
-- Where DBPort.dbo.TblMasterSetting.FldFkSite=@FkSite
if ((Select Count(*) 
	From 
		Route.[dbo].[Route] 
	where
			[from_port_id]=@from_port_id and
			subsidiary_id = @subsidiary_id and
			com_code = @com_code and
           [from_port_name] = @from_port_name and
           [to_port_id] = @to_port_id and
           [to_port_name] = @to_port_name and
           isnull([etd],0) = isnull(@etd,0) and
           isnull([eta],0) = isnull(@eta,0) and
           [vessel]=@vessel and
           [voyage] = @voyage and
           --[modify_date] = @modify_date  and
           isnull([imp_exp],0) = isnull(@imp_exp,0) and
           isnull([service],0) = isnull(@service,0) and
           isnull([from_sch_cy],0) = isnull(@from_sch_cy,0) and
           isnull([from_sch_cfs],0) = isnull(@from_sch_cfs,0) and
           isnull([from_sch_rece],0) = isnull(@from_sch_rece,0) and
           isnull([from_sch_si],0) = isnull(@from_sch_si,0) and
           isnull([from_sch_vgm],0) = isnull(@from_sch_vgm,0) and
           isnull([ts_port_name],0) = isnull(@ts_port_name,0) and
           [vessel_2] = @vessel_2 and
           [voyage_2] = @voyage_2 ) = 0)
	begin


		INSERT INTO Route.[dbo].[Route](
					[from_port_id]
					,subsidiary_id
					,com_code
				   ,[from_port_name]
				   ,[to_port_id]
				   ,[to_port_name]
				   ,[etd]
				   ,[eta]
				   ,[vessel]
				   ,[voyage]
				   ,[modify_date]
				   ,[imp_exp]
				   ,[service]
				   ,[from_sch_cy]
				   ,[from_sch_cfs]
				   ,[from_sch_rece]
				   ,[from_sch_si]
				   ,[from_sch_vgm]
				   ,[ts_port_name]
				   ,[vessel_2]
				   ,[voyage_2]
		--			,DisableEnable
		--           ,[FldFkMasterRoute]
		--           ,[FldFkFromPort]
		--           ,[FldFkToPort]
		)
			 VALUES(
			
			@from_port_id  ,
			@Subsidiary_id ,
			@com_code ,
			@from_port_name ,
			@to_port_id  ,
			@to_port_name ,
			@etd  ,
			@eta  ,
			@vessel ,
			@voyage ,
			@modify_date  ,
			@imp_exp  ,
			@service  ,
			@from_sch_cy  ,
			@from_sch_cfs  ,
			@from_sch_rece  ,
			@from_sch_si  ,
			@from_sch_vgm  ,
			@ts_port_name  ,
			@vessel_2  ,
			@voyage_2  
		  --@DisableEnable
		--	@FldFkMasterRoute ,
		--	@FkFromPort ,
		--	@FkToPort 
		)
	end

END
[7:04 PM, 9/2/2019] +98 912 177 1614: USE [Scraper]
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