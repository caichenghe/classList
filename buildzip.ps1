# Use Join-Path and Convert-Path to ensure path correctness
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $scriptDir "server"
$zipPath = Join-Path $scriptDir "server.zip"

# Verify if path exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: Cannot find server directory: $sourcePath" -ForegroundColor Red
    exit 1
}

Write-Host "Source Directory: $sourcePath" -ForegroundColor Cyan
Write-Host "Target File: $zipPath" -ForegroundColor Cyan

# 1. Build server first (ensure latest dist directory)
Write-Host "`nBuilding server..." -ForegroundColor Cyan
$buildResult = pnpm build:server 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    exit 1
}

# Verify if dist directory exists
$distPath = Join-Path $sourcePath "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "ERROR: dist directory does not exist after build: $distPath" -ForegroundColor Red
    Write-Host "Please check server/tsconfig.json and build command" -ForegroundColor Yellow
    exit 1
}

Write-Host "Build successful, dist directory exists" -ForegroundColor Green

# 2. Delete old zip
if (Test-Path $zipPath) {
    Write-Host "Deleting old zip file..." -ForegroundColor Yellow
    Remove-Item $zipPath -Force
}

# 3. Get all files, exclude unnecessary directories/files
Write-Host "Scanning files..." -ForegroundColor Cyan

$allFiles = Get-ChildItem -Path $sourcePath -Recurse -Force -File
Write-Host "  Total files: $($allFiles.Count)" -ForegroundColor Gray

$filesToInclude = $allFiles | Where-Object {
    $item = $_
    
    # Get relative path from sourcePath
    $relativePath = $item.FullName.Substring($sourcePath.Length).TrimStart('\', '/')
    
    # ========== Exclude Directories ==========
    # Exclude all files under node_modules
    if ($relativePath -like 'node_modules\*' -or $relativePath -like 'node_modules/*') {
        return $false
    }
    
    # Exclude all files under .git
    if ($relativePath -like '.git\*' -or $relativePath -like '.git/*') {
        return $false
    }
    
    # Exclude src source directory (keep only compiled dist)
    if ($relativePath -like 'src\*' -or $relativePath -like 'src/*') {
        return $false
    }
    
    # ========== Exclude File Types ==========
    # Exclude zip files
    if ($item.Extension -eq '.zip') {
        return $false
    }
    
    # Exclude TypeScript source files (.ts, .tsx)
    if ($item.Extension -eq '.ts' -or $item.Extension -eq '.tsx') {
        return $false
    }
    
    # Exclude type definition files (.d.ts) - including those in dist
    if ($item.Name -like '*.d.ts') {
        return $false
    }
    
    # Exclude source map files (.js.map, .css.map) - including those in dist
    if ($item.Extension -eq '.map') {
        return $false
    }
    
    # Exclude TypeScript build cache
    if ($item.Name -eq 'tsconfig.tsbuildinfo') {
        return $false
    }
    
    # Exclude TypeScript config files (not needed for pre-built dist)
    if ($item.Name -eq 'tsconfig.json' -or $item.Name -eq 'tsconfig.build.json') {
        return $false
    }
    
    # Exclude test files
    if ($item.Name -like '*.spec.ts' -or $item.Name -like '*.test.ts' -or 
        $item.Name -like '*.spec.js' -or $item.Name -like '*.test.js') {
        return $false
    }
    
    # Exclude dev config files (optional)
    if ($item.Name -like '.eslintrc.*' -or $item.Name -like '.prettierrc.*') {
        return $false
    }
    
    # Note: If using Docker deployment, keep Dockerfile and .dockerignore
    # If not using Docker, you can exclude them
    # if ($item.Name -eq 'Dockerfile' -or $item.Name -eq '.dockerignore') {
    #     return $false
    # }
    
    # Exclude NestJS CLI config
    if ($item.Name -eq 'nest-cli.json') {
        return $false
    }

    # Exclude cloud platform config
    if ($item.Name -eq 'cloudbaserc.json') {
        return $false
    }
    
    # Exclude npm config
    if ($item.Name -eq '.npmrc') {
        return $false
    }
    
    return $true
}

Write-Host "  Files after filtering: $($filesToInclude.Count)" -ForegroundColor Gray

# Show some key directory and file counts (for debugging)
$distFiles = $filesToInclude | Where-Object { $_.FullName -like '*\dist\*' }
Write-Host "  dist directory files: $($distFiles.Count)" -ForegroundColor Gray

# 4. Check if there are files to package
if ($filesToInclude.Count -eq 0) {
    Write-Host "No files found to package" -ForegroundColor Red
    exit 1
}

# 5. Create temporary directory structure to ensure dist is included correctly
Write-Host "`nPreparing package structure..." -ForegroundColor Cyan
$tempDir = Join-Path $env:TEMP "server-pack-$([Guid]::NewGuid())"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files to temp directory, maintaining relative path structure with forward slashes
foreach ($file in $filesToInclude) {
    # Get relative path and convert backslashes to forward slashes for Linux compatibility
    $relativePath = $file.FullName.Substring($sourcePath.Length).TrimStart('\', '/').Replace('\', '/')
    
    # Use forward slashes for destination path as well (for consistency)
    $destPath = $tempDir + '/' + $relativePath
    $destDir = Split-Path $destPath -Parent
    
    # Ensure target directory exists
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    # Copy file
    Copy-Item -Path $file.FullName -Destination $destPath -Force
}

Write-Host "  Copied $($filesToInclude.Count) files to temp directory" -ForegroundColor Gray

# Verify dist directory exists in temp
$distCheck = Join-Path $tempDir "dist"
if (Test-Path $distCheck) {
    $distFileCount = (Get-ChildItem -Path $distCheck -Recurse -File).Count
    Write-Host "  Verified: dist directory exists with $distFileCount files" -ForegroundColor Green
} else {
    Write-Host "  WARNING: dist directory NOT found in temp!" -ForegroundColor Red
    Write-Host "  Temp directory contents:" -ForegroundColor Yellow
    Get-ChildItem -Path $tempDir | Select-Object Name, FullName | Format-Table
}

# 6. Create archive using System.IO.Compression to ensure forward slashes in paths
Write-Host "`nPackaging with POSIX paths... (total $($filesToInclude.Count) files)" -ForegroundColor Cyan

# Load required assemblies
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Create ZIP file manually with forward slash paths
$zipFileStream = [System.IO.File]::Create($zipPath)
$zipArchive = New-Object System.IO.Compression.ZipArchive($zipFileStream, 'Create')

foreach ($file in $filesToInclude) {
    # Get relative path and convert backslashes to forward slashes
    $relativePath = $file.FullName.Substring($sourcePath.Length).TrimStart('\', '/').Replace('\', '/')
    
    # Create entry in ZIP
    $entry = $zipArchive.CreateEntry($relativePath)
    
    # Read file content and write to entry
    $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $entryStream = $entry.Open()
    $entryStream.Write($fileBytes, 0, $fileBytes.Length)
    $entryStream.Close()
}

# Close and dispose
$zipArchive.Dispose()
$zipFileStream.Close()
$zipFileStream.Dispose()

# 7. Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "`nPackage complete!" -ForegroundColor Green
Write-Host "Archive file: $zipPath" -ForegroundColor Cyan
$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "File size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
Write-Host "All paths use forward slashes (/) for Linux compatibility" -ForegroundColor Green
