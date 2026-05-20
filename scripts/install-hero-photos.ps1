$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$ProjectRoot = 'C:\Users\music\OneDrive\Desktop\New folder\HPS-WEB-FEBRUARY'

function Resize-Image {
    param(
        [string]$Src,
        [string]$Dest,
        [int]$MaxW,
        [int]$MaxH
    )
    if (-not (Test-Path -LiteralPath $Src)) { throw "Source not found: $Src" }
    $destDir = Split-Path -Parent $Dest
    if (-not (Test-Path -LiteralPath $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    # If the file already exists, force-delete via cmd (handles OneDrive
    # cloud-only reparse points that Remove-Item / File.Delete reject).
    if (Test-Path -LiteralPath $Dest) {
        try { (Get-Item -LiteralPath $Dest -Force).Attributes = 'Normal' } catch { }
        & cmd.exe /c "del /F /Q `"$Dest`"" | Out-Null
        if (Test-Path -LiteralPath $Dest) {
            throw "Could not delete existing destination: $Dest"
        }
    }

    $img = $null
    $bmp = $null
    $g = $null
    $ms = $null
    try {
        $img = [System.Drawing.Image]::FromFile($Src)
        $w = $img.Width
        $h = $img.Height
        $ratio = [Math]::Min($MaxW / $w, $MaxH / $h)
        if ($ratio -gt 1.0) { $ratio = 1.0 }
        $nw = [int]($w * $ratio)
        $nh = [int]($h * $ratio)

        $bmp = New-Object System.Drawing.Bitmap($nw, $nh, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.Clear([System.Drawing.Color]::Black)
        $g.DrawImage($img, 0, 0, $nw, $nh)

        $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 85L)

        # Save to memory first, then to disk via .NET File API. This sidesteps
        # GDI+'s "Generic Error" when the destination is a OneDrive placeholder.
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, $enc, $params)
        [System.IO.File]::WriteAllBytes($Dest, $ms.ToArray())

        $sizeKB = [Math]::Round((Get-Item -LiteralPath $Dest).Length / 1024, 1)
        Write-Output ("OK  -> {0} ({1}x{2}, {3} KB)" -f $Dest, $nw, $nh, $sizeKB)
    }
    finally {
        if ($ms)  { $ms.Dispose() }
        if ($g)   { $g.Dispose() }
        if ($bmp) { $bmp.Dispose() }
        if ($img) { $img.Dispose() }
    }
}

$desktopDir = Join-Path $ProjectRoot 'public\images\hero\desktop'
$mobileDir  = Join-Path $ProjectRoot 'public\images\hero\mobile'

# Desktop (landscape source images)
Resize-Image 'C:\Users\music\Downloads\HLP_HanemannBrand-109.jpg' (Join-Path $desktopDir 'hero-slide-1.jpg') 1920 1280
Resize-Image 'C:\Users\music\Downloads\HLP_HanemannBrand-333.jpg' (Join-Path $desktopDir 'hero-slide-2.jpg') 1920 1280
Resize-Image 'C:\Users\music\Downloads\HLP_HanemannBrand-394.jpg' (Join-Path $desktopDir 'hero-slide-3.jpg') 1920 1280

# Mobile (portrait source images)
Resize-Image 'C:\Users\music\Downloads\HLP_HanemannBrand-106.jpg' (Join-Path $mobileDir 'hero-slide-1.jpg') 1080 1920
Resize-Image 'C:\Users\music\Downloads\HLP_HanemannBrand-396 (1).jpg' (Join-Path $mobileDir 'hero-slide-2.jpg') 1080 1920
Resize-Image 'C:\Users\music\Downloads\HLP_HanemannBrand-332.jpg' (Join-Path $mobileDir 'hero-slide-3.jpg') 1080 1920

Write-Output "DONE"
