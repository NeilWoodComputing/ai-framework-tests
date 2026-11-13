Feature: Home page layout shell
  The scaffolded UI shows the layout shell on the home page (T-SETUP-002 / S2).

  Scenario: S2 — Home page renders with the layout shell
    Given the UI is running
    When I open the home page
    Then the layout shell is rendered
    And I see the heading "Fish"
