# clean

data <- readxl::read_excel("../../data/uncleaned_data.xlsx")

clean_data <- data %>% 
  mutate(Year = lubridate::year(Date),
         `Agency responsible for death` = str_replace(`Agency responsible for death`, ",.*",""),
         `Agency responsible for death` = paste0(`Agency responsible for death`, " (", State, ")"),
         `Cause of death` = str_replace(`Cause of death`, ",.*",""),
         Race = str_to_title(Race),
         `Cause of death` = str_to_title(`Cause of death`),
         `Symptoms of mental illness?` = str_to_title(`Symptoms of mental illness?`),
         ID = row_number())

write.csv(clean_data, "../../data/cleaned_data.csv")

# should be 75
# clean_data %>% filter(`Agency responsible for death` == "New York Police Department (NY)")
