# Self Registration with Company Search (THIS IS A WORK IN PROGRESS)

**Warning:** It is critical that you understand your external sharing configurations before using this self-registration workflow. This workflow allows external users to create contacts on accounts. Ensure your external organization-wide defaults are private for critical objects (e.g., Cases, Opportunities) and that your sharing sets are configured to a profile (e.g., "External User Profile") other than the one you have configured in this component.

[Read more about external sharing on Trailhead](https://trailhead.salesforce.com/content/learn/projects/communities_share_crm_data/sharing_rules) to understand how to configure sharing rules and external access for your Salesforce data.


## Dependencies
- This component expects that users are allowed to relate a contact to multiple accounts. To enable this, ensure that the "Contacts to Multiple Accounts" feature is activated in Salesforce. You can verify this by navigating to **Setup > Account Settings** and checking if the "Allow users to relate a contact to multiple accounts" option is enabled. For more details, refer to the [Salesforce documentation on Contacts to Multiple Accounts](https://help.salesforce.com/s/articleView?id=sf.contacts_relating_to_multiple_accounts.htm).