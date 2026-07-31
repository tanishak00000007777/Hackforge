$excludeDirs = @(
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".venv",
    "venv",
    "__pycache__",
    ".idea",
    ".vscode"
)

$excludeFiles = @(
    ".env",
    ".env.local",
    ".env.production",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
)

$excludeExtensions = @(
    ".png", ".jpg", ".jpeg", ".gif", ".ico",
    ".pdf", ".zip", ".tar", ".gz",
    ".mp4", ".webm", ".mov",
    ".exe", ".dll",
    ".db", ".sqlite"
)

$output = "project_context.txt"

"PROJECT CONTEXT" | Out-File $output

"`n========================================" | Out-File $output -Append
"PROJECT STRUCTURE" | Out-File $output -Append
"========================================`n" | Out-File $output -Append

tree /F /A | Out-File $output -Append

"`n========================================" | Out-File $output -Append
"SOURCE FILES" | Out-File $output -Append
"========================================" | Out-File $output -Append

Get-ChildItem -Recurse -File |
Where-Object {

    $file = $_

    $insideExcludedDir = $false

    foreach ($dir in $excludeDirs) {
        if ($file.FullName -match "[\\/]$([regex]::Escape($dir))[\\/]") {
            $insideExcludedDir = $true
            break
        }
    }

    -not $insideExcludedDir `
    -and $file.Name -notin $excludeFiles `
    -and $file.Extension -notin $excludeExtensions `
    -and $file.Name -ne $output
} |
ForEach-Object {

    $relativePath = Resolve-Path -Relative $_.FullName

    "`n`n========================================" |
        Out-File $output -Append

    "FILE: $relativePath" |
        Out-File $output -Append

    "========================================`n" |
        Out-File $output -Append

    Get-Content $_.FullName -ErrorAction SilentlyContinue |
        Out-File $output -Append
}

Write-Host "Created $output"