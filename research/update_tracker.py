import os

def update_tracker():
    tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"
    
    if not os.path.exists(tracker_path):
        print(f"Error: {tracker_path} not found")
        return
        
    lines = []
    updated_count = 0
    
    files_changed = "src/components/messaging/MessagingFeaturesConsole.tsx, src/components/messaging/ChatWindow.tsx, src/app/(main)/messages/page.tsx"
    notes = "Integrated into the direct messaging console and interactive simulations"
    
    with open(tracker_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("|"):
                parts = [p.strip() for p in line.split("|")]
                # check if there's enough columns and Batch is Batch 4
                if len(parts) >= 8 and parts[5] == "Batch 4":
                    # Update columns:
                    # parts[0] is empty
                    # parts[1] is ID
                    # parts[2] is Type
                    # parts[3] is Category
                    # parts[4] is Name
                    # parts[5] is Batch (Batch 4)
                    # parts[6] is Status
                    # parts[7] is Files Changed
                    # parts[8] is Notes
                    
                    parts[6] = "Implemented"
                    parts[7] = files_changed
                    parts[8] = notes
                    
                    # Reconstruct line
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
