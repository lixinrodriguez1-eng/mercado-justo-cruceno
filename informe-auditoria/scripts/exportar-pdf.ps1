# =============================================================
# Exporta el informe (.docx) y la presentación (.pptx) a PDF usando
# Microsoft Word y PowerPoint instalados. Antes de exportar el informe
# actualiza el índice y todos los campos.
# Uso: powershell -ExecutionPolicy Bypass -File exportar-pdf.ps1
# =============================================================
$ErrorActionPreference = "Stop"
$carpeta = Split-Path -Parent $PSScriptRoot
$docx = Join-Path $carpeta "Informe_Auditoria_WPO_OWASP_APA7.docx"
$pptx = Join-Path $carpeta "Presentacion_Auditoria_WPO_OWASP.pptx"

# ---------- Word ----------
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($docx)
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() }
    $doc.Save()
    $doc.ExportAsFixedFormat([IO.Path]::ChangeExtension($docx, ".pdf"), 17)  # 17 = PDF
    Write-Output ("Paginas del informe: " + $doc.ComputeStatistics(2))
    $doc.Close($false)
} finally { $word.Quit() }

# ---------- PowerPoint ----------
$ppt = New-Object -ComObject PowerPoint.Application
try {
    $pres = $ppt.Presentations.Open($pptx, $true, $false, $false)  # solo lectura, sin ventana
    $pres.SaveAs([IO.Path]::ChangeExtension($pptx, ".pdf"), 32)          # 32 = PDF
    Write-Output ("Diapositivas: " + $pres.Slides.Count)
    $pres.Close()
} finally { $ppt.Quit() }
Write-Output "PDF generados en $carpeta"
