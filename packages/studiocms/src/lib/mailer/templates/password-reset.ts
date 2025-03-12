const passwordReset = (link: string | URL) => `<!doctype html>
<html>
  <body>
    <div
      style='background-color:#F2F5F7;color:#242424;font-family:"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif;font-size:16px;font-weight:400;letter-spacing:0.15008px;line-height:1.5;margin:0;padding:32px 0;min-height:100%;width:100%'
    >
      <table
        align="center"
        width="100%"
        style="margin:0 auto;max-width:600px;background-color:#FFFFFF"
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
      >
        <tbody>
          <tr style="width:100%">
            <td>
              <h3
                style="font-weight:bold;text-align:left;margin:0;font-size:20px;padding:32px 24px 0px 24px"
              >
                Reset Your Password
              </h3>
              <div
                style="color:#474849;font-size:14px;font-weight:normal;text-align:left;padding:8px 24px 16px 24px"
              >
                Click the button below, or copy-paste the link to reset your
                password!
                <br />
                <br />
                If you didn't request a password reset, you can ignore this email and
                your password will not be changed.
              </div>
              <div style="text-align:left;padding:12px 24px 32px 24px">
                <a
                  href="${link}"
                  style="color:#FFFFFF;font-size:14px;font-weight:bold;background-color:#0068FF;display:inline-block;padding:12px 20px;text-decoration:none"
                  target="_blank"
                  ><span>Reset Password</span
                  ></a
                >
              </div>
              <div
                style="font-size:12px;font-weight:normal;padding:16px 24px 16px 24px"
              >
                Link: ${link}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>`;

export default passwordReset;
