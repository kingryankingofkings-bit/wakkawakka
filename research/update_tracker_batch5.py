import os

def update_tracker():
    tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"
    
    if not os.path.exists(tracker_path):
        print(f"Error: {tracker_path} not found")
        return
        
    lines = []
    updated_count = 0
    
    files_changed = "src/components/commerce/CommerceToolsConsole.tsx, src/app/(main)/shop/page.tsx, src/app/(main)/analytics/page.tsx"
    notes = "Integrated into the commerce and developer console component and interactive simulations"
    
    with open(tracker_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("|"):
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 8 and parts[5] == "Batch 5":
                    parts[6] = "Implemented"
                    parts[7] = files_changed
                    parts[8] = notes
                    
                    new_line = "| " + " | ".join(parts[1:9]) + " |\n"
                    lines.append(new_line)
                    updated_count += 1
                else:
                    lines.append(line)
            else:
                lines.append(line)
                
    print(f"Updated {updated_count} lines to 'Implemented'.")
    
    with open(tracker_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Successfully saved updated implementation_tracker.md")

if __name__ == "__main__":
    update_tracker()
