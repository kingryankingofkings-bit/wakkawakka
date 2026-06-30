$content = Get-Content -Path "C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"
$batch2Features = @()
foreach ($line in $content) {
    if ($line -like "*| Batch 2 |*") {
        $fields = $line.Split('|')
        if ($fields.Length -ge 8) {
            $id = $fields[1].Trim()
            $type = $fields[2].Trim()
            $category = $fields[3].Trim()
            $name = $fields[4].Trim()
            $batch = $fields[5].Trim()
            $status = $fields[6].Trim()
            $files = $fields[7].Trim()
            $notes = $fields[8].Trim()
            $batch2Features += [PSCustomObject]@{
                ID = $id
                Type = $type
                Category = $category
                Name = $name
                Batch = $batch
                Status = $status
                Files = $files
                Notes = $notes
            }
        }
    }
}

$markdown = @()
$markdown += "# Batch 2 Features List"
$markdown += ""
$markdown += "| ID | Name | Status | Files Changed | Notes |"
$markdown += "|---|---|---|---|---|"
foreach ($f in $batch2Features) {
    $markdown += "| $($f.ID) | $($f.Name) | $($f.Status) | $($f.Files) | $($f.Notes) |"
}

$markdown | Out-File -FilePath "C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_2\batch2_features.md" -Encoding utf8
Write-Output "Written $($batch2Features.Count) features to batch2_features.md"
