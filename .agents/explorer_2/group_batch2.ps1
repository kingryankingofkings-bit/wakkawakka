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
            $batch2Features += [PSCustomObject]@{
                ID = $id
                Type = $type
                Category = $category
                Name = $name
                Batch = $batch
                Status = $status
            }
        }
    }
}
Write-Output "Total Batch 2 features: $($batch2Features.Count)"
$batch2Features | Group-Object Category | Select-Object Name, Count | Out-String
