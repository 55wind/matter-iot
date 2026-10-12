param([string]$Pptx, [string]$OutDir, [string]$Pdf = "", [string]$Embed = "")
# PowerPoint COM: 슬라이드를 PNG로 (SaveCopyAs ppSaveAsPNG=18), 선택적으로 PDF (32)
# -Embed: 글꼴(Pretendard)을 넣은 PPTX로 다시 저장 (SaveAs ppSaveAsOpenXMLPresentation=24, EmbedTrueTypeFonts=msoTrue)
if (Test-Path $OutDir) { Remove-Item -Recurse -Force $OutDir }
$app = New-Object -ComObject PowerPoint.Application
try {
    $pres = $app.Presentations.Open($Pptx, $true, $false, $false)
    $pres.SaveCopyAs($OutDir, 18)
    if ($Pdf) { $pres.SaveCopyAs($Pdf, 32) }
    if ($Embed) { $pres.SaveAs($Embed, 24, -1) }
    $pres.Close()
    Get-ChildItem $OutDir | Select-Object -ExpandProperty Name
} finally {
    $app.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
