import {useRouteParams, Seo} from '@shopify/hydrogen';

import {Layout, AccountPasswordResetForm} from '~/components';

/**
 * This page shows a form for the user to enter a new password.
 * It should only be accessed by a link emailed to the user after
 * they initiate a password reset from `/account/recover`.
 */
export default function ResetPassword() {
  const {id, resetToken} = useRouteParams();

  return (
    <Layout>
      <Seo type="noindex" data={{title: 'Reset password'}} />
      <AccountPasswordResetForm id={id} resetToken={resetToken} />
    </Layout>
  );
}