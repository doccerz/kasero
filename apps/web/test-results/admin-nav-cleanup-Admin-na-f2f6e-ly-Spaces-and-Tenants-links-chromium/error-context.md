# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - text: Kasero
        - generic [ref=e5]: Admin
      - navigation [ref=e6]:
        - link "Dashboard" [ref=e7] [cursor=pointer]:
          - /url: /admin/dashboard
        - link "Spaces" [ref=e8] [cursor=pointer]:
          - /url: /admin/spaces
        - link "Tenants" [ref=e9] [cursor=pointer]:
          - /url: /admin/tenants
        - link "Contracts" [ref=e10] [cursor=pointer]:
          - /url: /admin/contracts
        - link "Profile" [ref=e11] [cursor=pointer]:
          - /url: /admin/profile
      - button "Logout" [ref=e14]
    - generic [ref=e16]:
      - generic [ref=e17]:
        - heading "Spaces" [level=1] [ref=e18]
        - button "New Space" [ref=e19]
      - paragraph [ref=e20]: No spaces found.
  - alert [ref=e21]
```