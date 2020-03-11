library(tidyverse)

data <- readr::read_csv("../../data/cleaned_data.csv")

# data %>% 
#   group_by(`Agency responsible for death`, State) %>% 
#   summarise(n()) %>% View()

departments <- data %>% 
  distinct(`Agency responsible for death`)

write.csv(departments, "../../data/department_data.csv")
