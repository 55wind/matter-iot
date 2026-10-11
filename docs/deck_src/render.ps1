param([string]$Pptx, [string]$OutDir, [string]$Pdf = "")
# PowerPoint COM: 슬라이드를 PNG로 (SaveCopyAs ppSaveAsPNG=18), 선택적으로 PDF (32)
if (Test-Path $OutDir) { Remove-Item -Recurse -Force $OutDir }
$app = New-Object -ComObject PowerPoint.Application
try {
    $pres = $app.Presentations.Open($Pptx, $true, $false, $false)
    $pres.SaveCopyAs($OutDir, 18)
    if ($Pdf) { $pres.SaveCopyAs($Pdf, 32) }
    $pres.Close()
    Get-ChildItem $OutDir | Select-Object -ExpandProperty Name
} finally {
    $app.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
