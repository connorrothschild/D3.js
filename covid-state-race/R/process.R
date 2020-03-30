library(tidyverse)

us_states <- readr::read_csv("../us-states.csv")

pivoted <- us_states %>% 
  group_by(state) %>% 
  mutate(cumulative_cases = cumsum(cases)) %>% 
  pivot_wider(names_from = date, values_from = cumulative_cases) %>% 
  mutate_if(is.numeric, function(x) {replace_na(x,0)}) %>% 
  select(-c(cases, deaths)) 

write.csv(pivoted, "../pivoted.csv")
