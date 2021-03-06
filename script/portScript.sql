USE [DBPort]
GO
/****** Object:  Table [dbo].[TblSite]    Script Date: 06/02/2019 17:57:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblSite](
	[FldPkSite] [int] IDENTITY(1,1) NOT NULL,
	[FldName] [nvarchar](500) NULL,
 CONSTRAINT [PK_TblSite] PRIMARY KEY CLUSTERED 
(
	[FldPkSite] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblUserType]    Script Date: 06/02/2019 17:57:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblUserType](
	[FldPkUserTypeCo] [int] IDENTITY(1,1) NOT NULL,
	[FldTitle] [nvarchar](50) NULL,
 CONSTRAINT [PK_TblUserType] PRIMARY KEY CLUSTERED 
(
	[FldPkUserTypeCo] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblPort]    Script Date: 06/02/2019 17:57:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblPort](
	[FldPkPort] [int] NOT NULL,
	[FldPort] [nvarchar](500) NULL,
	[FldPortCode] [nvarchar](50) NULL,
 CONSTRAINT [PK_TblPort] PRIMARY KEY CLUSTERED 
(
	[FldPkPort] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblMasterSetting]    Script Date: 06/02/2019 17:57:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblMasterSetting](
	[FldPkMasterSetting] [int] IDENTITY(1,1) NOT NULL,
	[FldFkSite] [int] NULL,
	[FldTime] [nvarchar](50) NULL,
	[FldTypeSchedule] [int] NULL,
	[FldDayOfMounth] [int] NULL,
	[FldLenghtToScraping] [int] NULL,
	[FldString] [nvarchar](100) NULL,
 CONSTRAINT [PK_TblMasterSetting] PRIMARY KEY CLUSTERED 
(
	[FldPkMasterSetting] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  StoredProcedure [dbo].[Sp_DeleteDetailsSetting]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
Create Proc [dbo].[Sp_DeleteDetailsSetting] @Pk int
AS
BEGIN

DELETE [dbo].[TblDetailsSetting]
where  [FldPkDetailsSetting]=@Pk
SELECT 'succeed' AS [message];
End
GO
/****** Object:  Table [dbo].[TblDetailsSetting]    Script Date: 06/02/2019 17:57:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblDetailsSetting](
	[FldPkDetailsSetting] [int] IDENTITY(1,1) NOT NULL,
	[FldFkMasterSetting] [int] NULL,
	[FldFkFromPort] [int] NULL,
	[FldFkToPort] [int] NULL,
 CONSTRAINT [PK_TblDetailsSetting] PRIMARY KEY CLUSTERED 
(
	[FldPkDetailsSetting] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblRoute]    Script Date: 06/02/2019 17:57:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblRoute](
	[FldPkRoute] [int] IDENTITY(1,1) NOT NULL,
	[FldFrom] [nvarchar](500) NULL,
	[FldTo] [nvarchar](500) NULL,
	[FldInlandTime] [datetime] NULL,
	[FldPortTime] [datetime] NULL,
	[FldDepDate] [datetime] NULL,
	[FldArrivalDate] [datetime] NULL,
	[FldVessel] [nvarchar](500) NULL,
	[FldOcean] [nvarchar](500) NULL,
	[FldTotal] [nvarchar](500) NULL,
	[FldFkMasterRoute] [int] NULL,
	[FldFkFromPort] [int] NULL,
	[FldFkToPort] [int] NULL,
 CONSTRAINT [PK_TblRoute] PRIMARY KEY CLUSTERED 
(
	[FldPkRoute] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblEmailSetting]    Script Date: 06/02/2019 17:57:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[TblEmailSetting](
	[FldPkEmailSetting] [int] IDENTITY(1,1) NOT NULL,
	[FldSendTime] [varchar](50) NULL,
 CONSTRAINT [PK_TblEmailSetting] PRIMARY KEY CLUSTERED 
(
	[FldPkEmailSetting] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadSystemEmail]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
Create Proc [dbo].[Sp_LoadSystemEmail]   @PkSystemEmail int=-1
AS
BEGIN
  SET NOCOUNT ON
Select  [FldPkSystemEmail],[FldServer],[FldPort],[FldEmail],[FldUserName],[FldPass] 
From    [dbo].[TblSystemEmail]
Where   [FldPkSystemEmail]=@PkSystemEmail or @PkSystemEmail=-1

END
GO
/****** Object:  Table [dbo].[TblSystemEmail]    Script Date: 06/02/2019 17:57:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[TblSystemEmail](
	[FldPkSystemEmail] [int] IDENTITY(1,1) NOT NULL,
	[FldServer] [char](50) NULL,
	[FldPort] [int] NULL,
	[FldEmail] [nvarchar](100) NULL,
	[FldUserName] [nvarchar](100) NULL,
	[FldPass] [nvarchar](50) NULL,
 CONSTRAINT [PK_TblSystemEmail] PRIMARY KEY CLUSTERED 
(
	[FldPkSystemEmail] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[TblEmail]    Script Date: 06/02/2019 17:57:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblEmail](
	[FldPkEmail] [int] IDENTITY(1,1) NOT NULL,
	[FldFkEmailSetting] [int] NULL,
	[FldEmail] [nvarchar](500) NULL,
 CONSTRAINT [PK_TblEmail] PRIMARY KEY CLUSTERED 
(
	[FldPkEmail] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblMasterRoute]    Script Date: 06/02/2019 17:57:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblMasterRoute](
	[FldPkMasterRoute] [int] IDENTITY(1,1) NOT NULL,
	[FldTime] [nvarchar](50) NULL,
	[FkSite] [int] NULL,
 CONSTRAINT [PK_TblMasterRoute] PRIMARY KEY CLUSTERED 
(
	[FldPkMasterRoute] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TblUser]    Script Date: 06/02/2019 17:57:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblUser](
	[FldPkUserCo] [int] IDENTITY(1,1) NOT NULL,
	[FldPassword] [nvarchar](200) NULL,
	[FldName] [nvarchar](50) NULL,
	[FldLastName] [nvarchar](50) NULL,
	[FldEmail] [nvarchar](100) NULL,
	[FldFkTypeCo] [int] NULL,
	[FldPhoneNo] [nvarchar](50) NULL,
	[FldActive] [bit] NULL,
	[FldGUIDFor_ResetPassword] [nvarchar](36) NULL,
	[FldGUIDExpieration] [datetime] NULL,
 CONSTRAINT [PK_TblUser] PRIMARY KEY CLUSTERED 
(
	[FldPkUserCo] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadSite]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER OFF
GO
CREATE Proc [dbo].[Sp_LoadSite] @PkSite int=-1
AS
BEGIN
select [FldPkSite],[FldName]
from   [dbo].[TblSite]
where [FldPkSite]=@PkSite or @PkSite=-1

end
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertSite]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER OFF
GO
CREATE Proc [dbo].[Sp_InsertSite] (@Name nvarchar(500)) 
AS
BEGIN



INSERT INTO [dbo].[TblSite]([FldName])
     VALUES(@Name)

Select SCOPE_IDENTITY() AS 'IDSite'

	
 End
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadMasterSetting]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_LoadMasterSetting] @FkSite int=-1,@SiteName nvarchar(500)=-1
AS
BEGIN
Select [FldFkSite] As Site,FldName as siteName,[FldTime] AS Time,[FldTypeSchedule] AS Schedule ,
       [FldDayOfMounth] AS DayMounth ,[FldLenghtToScraping] AS LenghtScrap,Fldstring
       
From   [dbo].[TblMasterSetting] inner join [dbo].[TblSite] on [FldFkSite]=[FldPkSite]
Where  ([FldFkSite]=@FkSite or @FkSite=-1) and ([FldName]=@SiteName or @SiteName=-1)

END
GO
/****** Object:  StoredProcedure [dbo].[SpLoadUsers]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SpLoadUsers] 
									(@UserCo       INT = -1, 
									 @UserType     INT = -1 )		
AS

															
									
    BEGIN
        SELECT tu.FldPkUserCo, 
               tu.FldName, 
               tu.FldLastName, 
               tu.FldEmail, 
               tu.FldPhoneNo, 
               tu.FldActive, 
			   tu.FldFkTypeCo,
			   ut.[FldTitle]
        FROM TblUser tu inner join [dbo].[TblUserType] ut
		     on   tu.FldFkTypeCo=[FldPkUserTypeCo]
             
        WHERE(tu.FldPkUserCo = @UserCo
              OR @UserCo = -1)
             AND (FldFkTypeCo = @UserType
                  OR @UserType = -1)
           
    END;
GO
/****** Object:  StoredProcedure [dbo].[SpActiveOrInActiveUser]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE  PROCEDURE [dbo].[SpActiveOrInActiveUser] @UserCo int ,@Active bit
AS
	BEGIN
		UPDATE dbo.TblUser
		SET
		    dbo.TblUser.FldActive=@Active
		WHERE dbo.TblUser.FldPkUserCo=@UserCo;

		SELECT 'succeed'AS [message];
	END
GO
/****** Object:  StoredProcedure [dbo].[SpSignUp]    Script Date: 06/02/2019 17:57:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
Create PROCEDURE [dbo].[SpSignUp] @UserCo       INT           = -1, 
                                 @Name         NVARCHAR(50)  = NULL, 
                                 @Lastname     NVARCHAR(50)  = NULL, 
                                 @Email        NVARCHAR(100) = NULL, 
                                 @Password     NVARCHAR(200) = NULL, 
                                 @TypeCo       INT           = NULL, 
                                 @PhoneNo      NVARCHAR(50)  = NULL, 
                                 @Active       BIT           = 1
AS	   
    BEGIN
        IF @UserCo = -1
			BEGIN
				IF NOT EXISTS (SELECT TOP 1 1 FROM dbo.TblUser tu WHERE tu.FldEmail=@Email)
					BEGIN
						INSERT INTO TblUser
						( 
						 FldPassword, 
						 FldName, 
						 FldLastname, 
						 FldEmail, 
						 FldFkTypeCo, 
						 FldPhoneNo, 
						 FldActive
						)
						       SELECT  
						              @Password, 
						              @Name, 
						              @Lastname, 
						              @Email, 
						              @TypeCo, 
						              @PhoneNo, 
						              1
						SELECT SCOPE_IDENTITY() AS UserCo, 
						       'succeed' AS [message];
					END
				ELSE
					SELECT 'duplicate email' AS message;
		END;
     ELSE
			BEGIN
			    UPDATE TblUser
			      SET 
			          FldName = @Name, 
			          FldLastname = @Lastname, 
			          FldPhoneNo = @PhoneNo, 
			          FldActive = @Active, 
			          TblUser.FldEmail=@Email
			    WHERE TblUser.FldPkUserCo = @UserCo;
			    SELECT @UserCo AS UserCo, 
			           'succeed' AS [message];
			END;
    END;
GO
/****** Object:  StoredProcedure [dbo].[SpLogin]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER OFF
GO
CREATE PROCEDURE [dbo].[SpLogin] @Email NVARCHAR(100), 
                                @Password NVARCHAR(200)
AS
    BEGIN
        IF EXISTS
        (
            SELECT TOP 1 1
            FROM dbo.TblUser tu
            WHERE tu.FldEmail = @Email
                  AND tu.FldPassword = @Password
        )
            BEGIN
                IF EXISTS
                (
                    SELECT TOP 1 1
                    FROM dbo.TblUser tu
                    WHERE tu.FldEmail = @Email
                          AND tu.FldPassword = @Password
                          AND FldActive = 1
                )
                    SELECT 'succeed' AS [message], 
                           tu.FldPkUserCo AS UserCo, 
                           tu.FldFkTypeCo,
						   tu.FldName,
						   tu.FldLastName,
						   tu.FldEmail
                    FROM TblUser tu
                         
                    WHERE tu.FldEmail = @Email
                          AND tu.FldPassword = @Password;
                    ELSE
                    SELECT 'user is inactive' AS [message];
        END;
            ELSE
            SELECT 'Invalid  username or password' AS [message];
    END;
GO
/****** Object:  StoredProcedure [dbo].[Sp_DeleteUser]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER OFF
GO
create proc [dbo].[Sp_DeleteUser] @IDUser int
as
begin

delete [dbo].[TblUser]
where [FldPkUserCo]=@IDUser
SELECT 'succeed' AS [message];
End
GO
/****** Object:  StoredProcedure [dbo].[SpChangePassword]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create PROCEDURE [dbo].[SpChangePassword] @UserId nvarchar(100),@OldPassword nvarchar(200),@NewPassword nvarchar(200)
AS
	BEGIN
		IF exists(SELECT top 1 1 FROM TblUser WHERE dbo.TblUser.FldPkUserCo=@UserId AND dbo.TblUser.FldPassword=@OldPassword)
			BEGIN
				UPDATE dbo.TblUser
				SET
				    dbo.TblUser.FldPassword = @NewPassword 
				WHERE dbo.TblUser.FldPkUserCo = @UserId ;
				SELECT 'succeed' AS [message];
			END
		ELSE
			SELECT 'Invalid username and password combination' AS [message];
	END
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertRoute]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
   Create SP By Miss.Shahmohammadi CreateDate:1398/03/5
   Target ==> 1/ذخیره سازی و وارد کردن فیلدها   
*/
CREATE Proc [dbo].[Sp_InsertRoute](@From nvarchar(500),@To nvarchar(500),@Inland datetime,@PortTime datetime
                           ,@DepDate datetime,@ArrivalDate datetime,@Vessel nvarchar(500),@Ocean nvarchar(500)
					       ,@Total nvarchar(500),@PkMasterRoute int )
 AS
 BEGIN
 Declare @FkFromPort int,@FkToPort int

 select @FkFromPort=(select [FldPkPort] from[dbo].[TblPort] where  [FldPortCode]=substring (@From,1,5)),@FkToPort=(select [FldPkPort] from[dbo].[TblPort] where  [FldPortCode]=substring (@To,1,5))

 INSERT INTO [dbo].[TblRoute]([FldFrom],[FldTo],[FldInlandTime],[FldPortTime],[FldDepDate],
                              [FldArrivalDate],[FldVessel],[FldOcean],[FldTotal],
							  [FldFkMasterRoute],[FldFkFromPort],[FldFkToPort])
                             VALUES(@From,@To,@Inland,@PortTime,
							        @DepDate, @ArrivalDate,
									@Vessel,@Ocean,@Total,@PkMasterRoute,@FkFromPort,@FkToPort)
	   Select SCOPE_IDENTITY() as 'PkRoute'

END
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadDetailsSetting]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_LoadDetailsSetting] @FkSite int
AS 
BEGIN
  Set NOCOUNT ON 
      Select [FldPkDetailsSetting],fport.[FldPort] as fromPortname ,fport.[FldPortCode] as fromPortcode
	  ,tport.[FldPort] as toPortname ,tport.[FldPortCode] as toPortcode
	  From  [dbo].[TblDetailsSetting] D
	  inner join [dbo].[TblMasterSetting] m 
	  ON     M.[FldPkMasterSetting]=D.[FldFkMasterSetting] inner join [dbo].[TblPort] as fport
	  on [FldFkFromPort]=fport.[FldPkPort]  inner join [dbo].[TblPort] as tport
	  on [FldFktoPort]=tport.[FldPkPort]
	  Where  [FldFkSite]=@FkSite
END
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertPort]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER OFF
GO
CREATE Proc [dbo].[Sp_InsertPort] @Port nvarchar(200),@Code nvarchar(10)
AS
BEGIN
 INSERT INTO[dbo].[TblPort] ([FldPort],[FldPortCode])
                    Values  (@Port,@Code)
 Select SCOPE_IDENTITY() as 'PkPort'

END
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadPort]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS OFF
GO
SET QUOTED_IDENTIFIER OFF
GO
CREATE PROCEDURE [dbo].[Sp_LoadPort]   @PkPort int=-1
AS
BEGIN
select [FldPort] AS text,[FldPkPort] AS id,[FldPortCode] AS code
from [dbo].[TblPort]
where [FldPkPort]=@PkPort or @PkPort=-1

end
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertDetailsSetting]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_InsertDetailsSetting] @Fksite int,@FkFromPort int,@FkToPort int
 AS
 BEGIN
 DECLARE @Fkmaster int
 SELECT @Fkmaster=[FldPkMasterSetting] FROM [dbo].[TblMasterSetting] WHERE [FldFkSite]=@Fksite
 INSERT INTO [dbo].[TblDetailsSetting]([FldFkMasterSetting],[FldFkFromPort],[FldFkToPort])
      VALUES(@Fkmaster,@FkFromPort,@FkToPort)
	   Select SCOPE_IDENTITY() as 'PkDetailsSetting'

END
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertOrUpdateMasterSetting]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_InsertOrUpdateMasterSetting] (@FkSite int,@Time nvarchar(50),
                                                   @TypeSchedule int,@DayOfMounth int,
												   @LenghtToScraping int,@FldString nvarchar(100))
AS
BEGIN
  IF not EXISTS (SELECT [FldPkMasterSetting] FROM [dbo].[TblMasterSetting] WHERE [FldFkSite]=@FkSite)
   BEGIN
     INSERT INTO  [dbo].[TblMasterSetting]([FldFkSite],[FldTime],[FldTypeSchedule],
	                                       [FldDayOfMounth],[FldLenghtToScraping],FldString)
       VALUES(@FkSite,@Time,@TypeSchedule,@DayOfMounth,@LenghtToScraping,@FldString)
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
			FldString=@FldString
			 

			WHERE [FldFkSite]=@FkSite
			select 'succeed' as message

	     
  END   
END
GO
/****** Object:  StoredProcedure [dbo].[SP_EmailReportNumberOfPortAndScrap]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[SP_EmailReportNumberOfPortAndScrap]  @GetDate nvarchar(50)
as
begin
Declare @Count1 int,@count2 int
select @Count1=Count(*)From(
select distinct [FldFkFromPort],[FldFkToPort]
--count(*)
 from  [dbo].[TblMasterRoute]
inner join [dbo].[TblRoute]
 on [FldPkMasterRoute]=[FldFkMasterRoute]
   where FldTime=@GetDate
 ) as a



 select @count2=count(*)
 from [dbo].[TblMasterRoute]
inner join [dbo].[TblRoute]
 on [FldPkMasterRoute]=[FldFkMasterRoute]
 where FldTime=@GetDate
 select @count1 as 'NumberOfPort',@count2 as 'NumberOfScrap'
 End
GO
/****** Object:  StoredProcedure [dbo].[Sp_ReportAllRoute]    Script Date: 06/02/2019 17:57:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE proc [dbo].[Sp_ReportAllRoute] @FromPort int ,@ToPort int,@ToInland datetime ,@FromInlandTime datetime 

as
begin
select *
 from [dbo].[TblRoute]
 where FldFkFromPort=@FromPort and FldFkToPort=@ToPort And(FldInlandTime>@FromInlandTime or FldInlandTime<@ToInland)

 end
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertOrUpdateEmailSetting]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_InsertOrUpdateEmailSetting] (@FldPkEmailSetting int=-1,@FldSendTime varchar(50))
AS
BEGIN

  IF @FldPkEmailSetting=-1
                 
   BEGIN
     INSERT INTO [dbo].[TblEmailSetting] ([FldSendTime])
                                   VALUES(@FldSendTime)
								   select SCOPE_IDENTITY() as 'PkEmailSeting'
   END

 ELSE
 BEGIN 
     update [dbo].[TblEmailSetting]
	  Set
			[FldSendTime]=@FldSendTime
	  Where 	FldPkEmailSetting=@FldPkEmailSetting
	  select 'succeed' as message	     
 END   
END
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadEmailSetting]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_LoadEmailSetting] @PkEmaillSetting int=-1 --int=-1
AS
BEGIN
  SET NOCOUNT ON
Select FldSendTime , FldPkEmailSetting AS PkId
From   [dbo].[TblEmailSetting]
Where  [FldPkEmailSetting]=@PkEmaillSetting or @PkEmaillSetting=-1

END
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertOrUpdateSystemEmail]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE Proc [dbo].[Sp_InsertOrUpdateSystemEmail] (@FldEmail varchar(100),@FldServer char(50),
                                                  @FldPort int,@FldUserName nvarchar(100),
												  @FldPass nvarchar(50)
												  )
AS
BEGIN
  SET NOCOUNT ON

  IF NOT EXISTS (SELECT [FldPkSystemEmail] FROM [dbo].[TblSystemEmail] Where [FldEmail]=@FldEmail )  
                 
   BEGIN
     INSERT INTO [dbo].[TblSystemEmail] ([FldServer],[FldPort],[FldEmail],[FldUserName],[FldPass])
                                   VALUES(@FldServer,@FldPort,@FldEmail,@FldUserName,@FldPass)
   END

 ELSE
 BEGIN 
     update [dbo].[TblSystemEmail]
	  Set
			    [FldServer]=@FldServer,
				[FldPort]=@FldPort,
				[FldUserName]=@FldUserName,
				[FldPass]=@FldPass

	  Where 	[FldEmail]=@FldEmail
	  Select 'succeed' as message	     
 END   
END
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertMasterRoute]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
   Create SP By Miss.Shahmohammadi CreateDate:1398/03/5
   Target ==> 1/ذخیره سازی و وارد کردن فیلدها   
*/
CREATE Proc [dbo].[Sp_InsertMasterRoute] (@FldTime nvarchar(50)
                                         ,@FkSite int)
 AS
 BEGIN

 INSERT INTO [dbo].[TblMasterRoute]([FldTime],[FkSite])
                             VALUES(@FldTime,@FkSite )
	   Select SCOPE_IDENTITY() as 'PkMasterRoute',@FkSite

END
GO
/****** Object:  StoredProcedure [dbo].[Sp_InsertEmail]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
Create Proc [dbo].[Sp_InsertEmail] @PkMasterSetting int,@Email nvarchar(50)
as
begin
insert into TblEmail(FldFkEmailSetting,FldEmail)
             values(@PkMasterSetting,@Email)

			 select Scope_identity() as 'pkEmail'

			 end
GO
/****** Object:  StoredProcedure [dbo].[Sp_DeleteEmail]    Script Date: 06/02/2019 17:57:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create proc [dbo].[Sp_DeleteEmail] @PkEmail int
as
begin

delete tblemail
where FldpkEmail=@PkEmail

select 'succeed' as message
end
GO
/****** Object:  StoredProcedure [dbo].[Sp_LoadEmail]    Script Date: 06/02/2019 17:57:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create proc  [dbo].[Sp_LoadEmail]  @FkEmailSetting int
as
begin

select FldPkEmail,FldEmail
from TblEmail
where FldFkEmailSetting=@FkEmailSetting

end
GO
/****** Object:  ForeignKey [FK_TblUser_TblUserType]    Script Date: 06/02/2019 17:57:41 ******/
ALTER TABLE [dbo].[TblUser]  WITH CHECK ADD  CONSTRAINT [FK_TblUser_TblUserType] FOREIGN KEY([FldFkTypeCo])
REFERENCES [dbo].[TblUserType] ([FldPkUserTypeCo])
GO
ALTER TABLE [dbo].[TblUser] CHECK CONSTRAINT [FK_TblUser_TblUserType]
GO
