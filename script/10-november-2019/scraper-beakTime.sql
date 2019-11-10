		
	USE [Scraper]
GO

	ALTER TABLE [dbo].[TblMasterSetting]
	ADD FldbreakTime INT
GO	
	
	----------------------------------------
	----------------------------------------



ALTER Proc [dbo].[Sp_InsertOrUpdateMasterSetting] (@FkSite int,@Time nvarchar(50),
                                                   @TypeSchedule int,@DayOfMounth int,
												   @LenghtToScraping int,@FldString nvarchar(100),
												   @DisableEnable bit,@Subsidiary_id char(20),
												   @com_code varchar(50),@breakTime int)
AS
BEGIN
  IF not EXISTS (SELECT [FldPkMasterSetting] FROM [dbo].[TblMasterSetting] WHERE [FldFkSite]=@FkSite)
   BEGIN
     INSERT INTO  [dbo].[TblMasterSetting]([FldFkSite],[FldTime],[FldTypeSchedule],
	                                       [FldDayOfMounth],[FldLenghtToScraping],FldString,
										   [DisableEnable],[Subsidiary_id],[com_code],FldbreakTime)
       VALUES(@FkSite,@Time,@TypeSchedule,@DayOfMounth,@LenghtToScraping,@FldString,@DisableEnable,
	          @Subsidiary_id,@com_code,@breakTime)
	     Select SCOPE_IDENTITY() as 'FldPkMasterSetting'
   END

 ELSE
 BEGIN 
     update [dbo].[TblMasterSetting]
	  Set   
			[FldTime]=@Time,
			[FldTypeSchedule]=@TypeSchedule,
			[FldDayOfMounth]=@DayOfMounth,
			[FldLenghtToScraping]=@LenghtToScraping,
			FldString=@FldString,
			[DisableEnable]=@DisableEnable,
			[Subsidiary_id]=@Subsidiary_id,
			[com_code]=@com_code,FldbreakTime=@breakTime

	  WHERE [FldFkSite]=@FkSite
			select 'succeed' as message
  
  END   
END
GO

	----------------------------------------
	----------------------------------------

	
	
	ALTER Proc [dbo].[Sp_LoadMasterSetting] @FkSite int=-1,@SiteName nvarchar(500)=-1
AS
BEGIN
Select [FldFkSite] As Site,FldName as siteName,[FldTime] AS Time,[FldTypeSchedule] AS Schedule ,
       [FldDayOfMounth] AS DayMounth ,[FldLenghtToScraping] AS LenghtScrap,Fldstring,
       [DisableEnable],[Subsidiary_id],[com_code],FldbreakTime
       
From   [dbo].[TblMasterSetting] inner join [dbo].[TblSite] on [FldFkSite]=[FldPkSite]
Where  ([FldFkSite]=@FkSite or @FkSite=-1) and ([FldName]=@SiteName or @SiteName=-1)

END
GO
