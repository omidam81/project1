/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
CREATE TABLE dbo.Tmp_TblSite
	(
	FldPkSite int NOT NULL,
	FldName nvarchar(500) NULL
	)  ON [PRIMARY]
GO
IF EXISTS(SELECT * FROM dbo.TblSite)
	 EXEC('INSERT INTO dbo.Tmp_TblSite (FldPkSite, FldName)
		SELECT FldPkSite, FldName FROM dbo.TblSite WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.TblSite
GO
EXECUTE sp_rename N'dbo.Tmp_TblSite', N'TblSite', 'OBJECT' 
GO
ALTER TABLE dbo.TblSite ADD CONSTRAINT
	PK_TblSite PRIMARY KEY CLUSTERED 
	(
	FldPkSite
	) ON [PRIMARY]

GO
COMMIT
--------------------------
insert into [dbo].[TblSite]
values (2,'www.maersk.com')